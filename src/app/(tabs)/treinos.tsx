import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { showDialog } from '../../components/Dialog';
import { Badge, Button, Card, Empty, IconButton, Screen, SectionHeader, T } from '../../components/ui';
import { estimateMinutes, muscleSummary, totalSets } from '../../lib/planUtils';
import { useActivePlan, useStore } from '../../store/useStore';
import { colors, space } from '../../theme';

export default function Treinos() {
  const plan = useActivePlan();
  const session = useStore((s) => s.session);
  const startSession = useStore((s) => s.startSession);
  const addDay = useStore((s) => s.addDay);
  const generateNewPlan = useStore((s) => s.generateNewPlan);
  const setNextDay = useStore((s) => s.setNextDay);

  const start = (dayId?: string) => {
    if (session) {
      showDialog('Treino em andamento', 'Você já tem um treino aberto. Quer continuar nele?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Continuar treino', onPress: () => router.push('/sessao') },
      ]);
      return;
    }
    startSession(plan?.id, dayId);
    router.push('/sessao');
  };

  const regenerate = () =>
    showDialog(
      'Gerar novo plano?',
      'Um novo plano será criado a partir do seu perfil. O plano atual continua salvo em "Meus planos".',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Gerar', onPress: () => generateNewPlan() },
      ],
    );

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <T v="display">Treinos</T>
        <View style={{ flexDirection: 'row' }}>
          <IconButton icon="sparkles-outline" onPress={regenerate} label="Gerar novo plano" />
          <IconButton icon="albums-outline" onPress={() => router.push('/planos')} label="Meus planos" />
        </View>
      </View>

      {!plan ? (
        <Empty icon="barbell-outline" title="Nenhum plano ainda" text="Gere um plano automático a partir do seu perfil ou monte o seu do zero.">
          <Button title="Gerar plano automático" icon="sparkles" onPress={() => generateNewPlan()} />
          <Button title="Meus planos" variant="ghost" onPress={() => router.push('/planos')} />
        </Empty>
      ) : (
        <>
          <Card style={{ marginTop: space.lg, gap: 6 }}>
            <T v="tiny">Plano ativo</T>
            <T v="h1">{plan.nome}</T>
            <T v="small">{plan.descricao}</T>
          </Card>

          <SectionHeader title={`${plan.dias.length} treinos na rotação`} action="+ Adicionar treino" onAction={() => {
            const id = addDay(plan.id);
            router.push({ pathname: '/dia/[planId]/[dayId]', params: { planId: plan.id, dayId: id } });
          }} />

          <View style={{ gap: space.md }}>
            {plan.dias.map((d, i) => {
              const next = i === plan.proximo;
              return (
                <Card
                  key={d.id}
                  onPress={() => router.push({ pathname: '/dia/[planId]/[dayId]', params: { planId: plan.id, dayId: d.id } })}
                  style={next ? { borderColor: colors.accent, borderWidth: 1 } : undefined}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.md }}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                        <T v="h2" numberOfLines={1} style={{ flexShrink: 1 }}>
                          {d.nome}
                        </T>
                        {next && <Badge label="PRÓXIMO" soft={colors.accentSoft} />}
                      </View>
                      <T v="small" numberOfLines={2}>
                        {muscleSummary(d) || d.foco || 'Sem exercícios ainda'}
                      </T>
                      <View style={{ flexDirection: 'row', gap: space.lg, marginTop: 4 }}>
                        <Meta icon="list-outline" text={`${d.exercicios.length} exercícios`} />
                        <Meta icon="layers-outline" text={`${totalSets(d.exercicios)} séries`} />
                        <Meta icon="time-outline" text={`~${estimateMinutes(d.exercicios)} min`} />
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMute} />
                  </View>
                  <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md }}>
                    <Button title="Iniciar" icon="play" small style={{ flex: 1 }} onPress={() => start(d.id)} disabled={!d.exercicios.length} />
                    {!next && (
                      <Button title="Marcar como próximo" variant="secondary" small onPress={() => setNextDay(plan.id, i)} />
                    )}
                  </View>
                </Card>
              );
            })}
          </View>

          <Pressable onPress={() => start()} style={{ marginTop: space.xl, alignItems: 'center', padding: space.md }}>
            <T style={{ color: colors.accent, fontWeight: '700' }}>Começar treino livre (sem plano)</T>
          </Pressable>
        </>
      )}
    </Screen>
  );
}

function Meta({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Ionicons name={icon} size={13} color={colors.textMute} />
      <T v="small" style={{ fontSize: 12 }}>
        {text}
      </T>
    </View>
  );
}
