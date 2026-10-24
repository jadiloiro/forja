import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { Badge, Button, Card, Empty, Field, IconButton, Screen, SectionHeader, T } from '../components/ui';
import { formatShortDate } from '../lib/date';
import { useStore } from '../store/useStore';
import { colors, space } from '../theme';

export default function Planos() {
  const plans = useStore((s) => s.plans);
  const activeId = useStore((s) => s.activePlanId ?? s.plans[0]?.id);
  const setActive = useStore((s) => s.setActivePlan);
  const rename = useStore((s) => s.renamePlan);
  const del = useStore((s) => s.deletePlan);
  const dup = useStore((s) => s.duplicatePlan);
  const createEmpty = useStore((s) => s.createEmptyPlan);
  const generate = useStore((s) => s.generateNewPlan);
  const [editing, setEditing] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  return (
    <Screen edges={['bottom']}>
      <View style={{ gap: space.sm }}>
        <Button title="Gerar plano automático pelo perfil" icon="sparkles" onPress={() => { generate(); router.back(); }} />
        <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'flex-end' }}>
          <Field style={{ flex: 1 }} label="Ou crie do zero" placeholder="Nome do plano" value={newName} onChangeText={setNewName} />
          <Button
            title="Criar"
            variant="secondary"
            onPress={() => {
              createEmpty(newName.trim());
              setNewName('');
              router.back();
            }}
          />
        </View>
      </View>

      <SectionHeader title={`${plans.length} plano${plans.length === 1 ? '' : 's'}`} />
      {!plans.length && <Empty icon="albums-outline" title="Nenhum plano salvo" />}
      <View style={{ gap: space.md }}>
        {plans.map((p) => {
          const active = p.id === activeId;
          return (
            <Card key={p.id} style={active ? { borderColor: colors.accent, borderWidth: 1 } : undefined}>
              {editing === p.id ? (
                <Field autoFocus value={p.nome} onChangeText={(t) => rename(p.id, t)} onBlur={() => setEditing(null)} onSubmitEditing={() => setEditing(null)} />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                  <T v="h2" style={{ flexShrink: 1 }} numberOfLines={1}>
                    {p.nome}
                  </T>
                  {active && <Badge label="ATIVO" soft={colors.accentSoft} />}
                </View>
              )}
              <T v="small" style={{ marginTop: 4 }}>
                {p.dias.length} treinos · criado em {formatShortDate(p.criadoEm)}
              </T>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: space.md, gap: space.xs }}>
                {!active && <Button small title="Ativar" onPress={() => setActive(p.id)} style={{ marginRight: 'auto' }} />}
                {active && <View style={{ marginRight: 'auto' }} />}
                <IconButton icon="pencil-outline" label="Renomear" onPress={() => setEditing(p.id)} />
                <IconButton icon="copy-outline" label="Duplicar" onPress={() => dup(p.id)} />
                <IconButton
                  icon="trash-outline"
                  label="Excluir"
                  color={colors.danger}
                  onPress={() =>
                    Alert.alert('Excluir plano?', `"${p.nome}" será apagado. O histórico de treinos não é afetado.`, [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Excluir', style: 'destructive', onPress: () => del(p.id) },
                    ])
                  }
                />
              </View>
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}
