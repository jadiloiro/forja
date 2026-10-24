import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Alert, View } from 'react-native';

import { LineChart } from '../../components/charts';
import { ExerciseAnimation } from '../../components/ExerciseMedia';
import { Badge, Card, Empty, IconButton, Screen, SectionHeader, T } from '../../components/ui';
import { EQUIP_LABEL, GROUP_LABEL } from '../../data/types';
import { formatShortDate } from '../../lib/date';
import { e1rmSeries, fmtKg, lastPerformance, personalRecords } from '../../lib/progression';
import { useExercise, useStore } from '../../store/useStore';
import { colors, space } from '../../theme';

export default function ExercicioDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ex = useExercise(id);
  const history = useStore((s) => s.history);
  const deleteCustom = useStore((s) => s.deleteCustomExercise);

  const pr = useMemo(() => (id ? personalRecords(history)[id] : undefined), [history, id]);
  const last = useMemo(() => (id ? lastPerformance(history, id) : undefined), [history, id]);
  const series = useMemo(() => (id ? e1rmSeries(history, id).slice(-12) : []), [history, id]);

  if (!ex) {
    return (
      <Screen edges={[]}>
        <Empty icon="alert-circle-outline" title="Exercício não encontrado" />
      </Screen>
    );
  }

  return (
    <Screen edges={[]}>
      <Stack.Screen
        options={{
          title: '',
          headerRight: ex.custom
            ? () => (
                <View style={{ flexDirection: 'row' }}>
                  <IconButton icon="create-outline" label="Editar" onPress={() => router.push({ pathname: '/novo-exercicio', params: { id: ex.id } })} />
                  <IconButton
                    icon="trash-outline"
                    label="Excluir"
                    color={colors.danger}
                    onPress={() =>
                      Alert.alert('Excluir exercício?', 'Ele continuará aparecendo no histórico, mas sairá da biblioteca.', [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                          text: 'Excluir',
                          style: 'destructive',
                          onPress: () => {
                            deleteCustom(ex.id);
                            router.back();
                          },
                        },
                      ])
                    }
                  />
                </View>
              )
            : undefined,
        }}
      />
      <ExerciseAnimation exercise={ex} />

      <View style={{ marginTop: space.lg, gap: space.sm }}>
        <T v="h1">{ex.nome}</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          <Badge label={GROUP_LABEL[ex.grupo]} soft={colors.accentSoft} />
          {ex.secundarios.map((g) => (
            <Badge key={g} label={GROUP_LABEL[g]} color={colors.textDim} />
          ))}
          <Badge label={EQUIP_LABEL[ex.equipamento]} color={colors.textDim} />
          <Badge label={ex.tipo === 'composto' ? 'Multiarticular' : 'Isolado'} color={colors.textDim} />
          <Badge label={['', 'Fácil', 'Moderado', 'Técnico'][ex.nivel]} color={colors.textDim} />
        </View>
      </View>

      {ex.passos.length > 0 && (
        <>
          <SectionHeader title="Como executar" />
          <Card style={{ gap: space.md }}>
            {ex.passos.map((p, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: space.md }}>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: colors.accentSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <T style={{ color: colors.accent, fontWeight: '800', fontSize: 12 }}>{i + 1}</T>
                </View>
                <T style={{ flex: 1, lineHeight: 21 }}>{p}</T>
              </View>
            ))}
          </Card>
        </>
      )}

      {ex.dicas.length > 0 && (
        <>
          <SectionHeader title="Dicas e erros comuns" />
          <Card style={{ gap: space.sm }}>
            {ex.dicas.map((d, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: space.sm }}>
                <Ionicons name="alert-circle-outline" size={18} color={colors.warn} style={{ marginTop: 1 }} />
                <T style={{ flex: 1, lineHeight: 21 }}>{d}</T>
              </View>
            ))}
          </Card>
        </>
      )}

      <SectionHeader title="Seu histórico" />
      {!pr && !last ? (
        <Card>
          <T v="small">Você ainda não registrou este exercício. Os recordes e a evolução aparecem aqui depois do primeiro treino.</T>
        </Card>
      ) : (
        <View style={{ gap: space.md }}>
          <View style={{ flexDirection: 'row', gap: space.md }}>
            <Card style={{ flex: 1, gap: 4 }}>
              <T v="tiny">Maior carga</T>
              <T v="h2">{fmtKg(pr?.pesoMax)}</T>
            </Card>
            <Card style={{ flex: 1, gap: 4 }}>
              <T v="tiny">1RM estimado</T>
              <T v="h2">{fmtKg(pr ? Math.round(pr.e1rm) : null)}</T>
            </Card>
          </View>
          {last && (
            <Card style={{ gap: 6 }}>
              <T v="tiny">Última vez · {formatShortDate(last.data)}</T>
              <T>{last.sets.map((s) => `${s.peso ?? 0}kg × ${s.reps ?? 0}`).join('   ·   ')}</T>
            </Card>
          )}
          {series.length >= 2 && (
            <Card style={{ gap: space.sm }}>
              <T v="tiny">Evolução do 1RM estimado</T>
              <LineChart data={series.map((p) => ({ label: formatShortDate(p.data), value: p.valor }))} unit="kg" />
            </Card>
          )}
        </View>
      )}

      {ex.img && (
        <T v="small" style={{ marginTop: space.xl, fontSize: 11, color: colors.textMute }}>
          Imagens: Free Exercise DB (domínio público).
        </T>
      )}
    </Screen>
  );
}
