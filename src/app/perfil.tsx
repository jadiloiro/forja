import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, Platform, Switch, View } from 'react-native';

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
import { showDialog } from '../components/Dialog';
import { Button, Card, Field, Screen, SectionHeader, Stepper, T } from '../components/ui';
import { pickBackupFile, saveBackupFile } from '../lib/backupFile';
import { computeTargets } from '../lib/nutrition';
import { exactAlarmGranted, requestExactAlarm } from '../lib/restNotifications';
import { exportBackup, useStore } from '../store/useStore';
import { colors, space } from '../theme';

export default function Perfil() {
  const profile = useStore((s) => s.profile);
  const saveProfile = useStore((s) => s.saveProfile);
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const importBackup = useStore((s) => s.importBackup);
  const resetAll = useStore((s) => s.resetAll);
  const [d, setD] = useState<ProfileDraft>(toDraft(profile));
  const [backupText, setBackupText] = useState('');
  const [busy, setBusy] = useState(false);
  const [exactOk, setExactOk] = useState<boolean>();
  // O pedido de alarme exato abre as configurações do sistema e a promise pode nunca
  // resolver; por isso o estado é relido sempre que o app volta ao primeiro plano.
  useEffect(() => {
    const check = () => exactAlarmGranted().then(setExactOk).catch(() => {});
    check();
    const sub = AppState.addEventListener('change', (st) => st === 'active' && check());
    return () => sub.remove();
  }, []);
  const set =(patch: Partial<ProfileDraft>) => setD((x) => ({ ...x, ...patch }));

  const restore = (json: string) =>
    showDialog('Restaurar backup?', 'Todos os dados atuais serão substituídos.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Restaurar',
        style: 'destructive',
        onPress: () => {
          try {
            importBackup(json);
            setBackupText('');
            showDialog('Pronto', 'Backup restaurado.');
            router.back();
          } catch (e) {
            showDialog('Não foi possível restaurar', e instanceof SyntaxError ? 'O arquivo não é um backup válido.' : e instanceof Error ? e.message : 'Backup inválido.');
          }
        },
      },
    ]);
  const err = draftErrors(d);
  const preview = !err ? computeTargets(fromDraft(d)) : undefined;

  const save = () => {
    if (err) return showDialog('Confira os dados', err);
    showDialog('Salvar perfil', 'Quer gerar um novo plano de treino com esses dados? O plano atual continua salvo.', [
      { text: 'Só salvar', onPress: () => { saveProfile(fromDraft(d)); router.back(); } },
      { text: 'Salvar e gerar plano', onPress: () => { saveProfile(fromDraft(d), { regenerate: true }); router.back(); } },
    ]);
  };

  return (
    <Screen edges={['bottom']}>
      <SectionHeader title="Dados pessoais" />
      <BasicsStep d={d} set={set} />
      <SectionHeader title="Objetivo" />
      <GoalStep d={d} set={set} />
      <SectionHeader title="Experiência" />
      <LevelStep d={d} set={set} />
      <SectionHeader title="Rotina" />
      <ScheduleStep d={d} set={set} />
      <SectionHeader title="Atividade no dia a dia" />
      <ActivityStep d={d} set={set} />
      <SectionHeader title="Músculos prioritários" />
      <PriorityStep d={d} set={set} />

      {preview && (
        <Card style={{ marginTop: space.xl, gap: 4 }}>
          <T v="tiny">Cálculo energético</T>
          <T v="small">Metabolismo basal (Mifflin-St Jeor): {preview.tmb} kcal</T>
          <T v="small">Gasto diário estimado: {preview.gasto} kcal</T>
          <T v="small">
            Meta: {preview.kcal} kcal ({preview.ajuste > 0 ? '+' : ''}
            {Math.round(preview.ajuste * 100)}%) · P {preview.p} g · C {preview.c} g · G {preview.g} g
          </T>
        </Card>
      )}

      <Button title="Salvar perfil" style={{ marginTop: space.lg }} onPress={save} />

      <SectionHeader title="Progressão de carga" />
      <Card style={{ gap: space.md }}>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Stepper label="Barra / máquina" value={settings.incrementoBarraKg} step={0.5} min={0.5} max={10} suffix="kg" onChange={(v) => updateSettings({ incrementoBarraKg: v })} />
          <Stepper label="Halteres" value={settings.incrementoHalterKg} step={0.5} min={0.5} max={10} suffix="kg" onChange={(v) => updateSettings({ incrementoHalterKg: v })} />
        </View>
        <T v="small">Quanto o app sugere subir quando você bate o topo da faixa de repetições em todas as séries.</T>
        <Stepper label="Peso da barra olímpica (calculadora de anilhas)" value={settings.pesoBarraKg ?? 20} step={2.5} min={5} max={25} suffix="kg" onChange={(v) => updateSettings({ pesoBarraKg: v })} />
      </Card>

      <SectionHeader title="Descanso" />
      <Card style={{ gap: space.md }}>
        <ToggleRow label="Vibrar no fim do descanso" value={settings.vibrarDescanso} onChange={(v) => updateSettings({ vibrarDescanso: v })} />
        {Platform.OS !== 'web' && (
          <ToggleRow
            label="Avisar com o app minimizado"
            hint="Notificação quando o descanso acaba, mesmo com a tela bloqueada."
            value={settings.notificarDescanso ?? true}
            onChange={(v) => updateSettings({ notificarDescanso: v })}
          />
        )}
        {(settings.notificarDescanso ?? true) && exactOk === false && (
          <View style={{ gap: space.sm }}>
            <T v="small" style={{ color: colors.warn }}>
              O Android pode atrasar o aviso alguns minutos. Permita &quot;alarmes e lembretes&quot; para ele chegar na hora.
            </T>
            <Button small variant="secondary" icon="alarm-outline" title="Permitir alarmes exatos" onPress={() => requestExactAlarm().catch(() => {})} />
          </View>
        )}
      </Card>

      <SectionHeader title="Backup dos dados" />
      <Card style={{ gap: space.md }}>
        <T v="small">Seus dados ficam só neste aparelho. Salve um arquivo de backup no Drive, e-mail ou WhatsApp para não perder o histórico.</T>
        <Button
          title="Salvar arquivo de backup"
          icon="download-outline"
          loading={busy}
          onPress={async () => {
            setBusy(true);
            try {
              await saveBackupFile(exportBackup());
            } catch (e) {
              showDialog('Não foi possível salvar', e instanceof Error ? e.message : undefined);
            } finally {
              setBusy(false);
            }
          }}
        />
        <Button
          title="Restaurar de um arquivo"
          icon="folder-open-outline"
          variant="secondary"
          onPress={async () => {
            try {
              const json = await pickBackupFile();
              if (json) restore(json);
            } catch (e) {
              showDialog('Não foi possível abrir o arquivo', e instanceof Error ? e.message : undefined);
            }
          }}
        />
        <Field label="Ou cole o texto do backup" value={backupText} onChangeText={setBackupText} multiline style={{ maxHeight: 120 }} />
        <Button title="Restaurar texto colado" variant="secondary" small disabled={!backupText.trim()} onPress={() => restore(backupText.trim())} />
      </Card>

      <Button
        title="Apagar todos os dados"
        variant="danger"
        style={{ marginTop: space.xl }}
        onPress={() =>
          showDialog('Apagar tudo?', 'Perfil, planos, histórico e diário alimentar serão apagados. Não dá para desfazer.', [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Apagar tudo',
              style: 'destructive',
              onPress: () => {
                resetAll();
                router.replace('/onboarding');
              },
            },
          ])
        }
      />
      <T v="small" style={{ marginTop: space.xl, fontSize: 11, color: colors.textMute, textAlign: 'center' }}>
        Forja · imagens de exercícios: Free Exercise DB (domínio público) · alimentos: Tabela TACO (NEPA/UNICAMP).{'\n'}
        As estimativas não substituem orientação de profissional de educação física ou nutricionista.
      </T>
    </Screen>
  );
}

function ToggleRow({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
      <View style={{ flex: 1, gap: 2 }}>
        <T>{label}</T>
        {hint ? <T v="small">{hint}</T> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.accent, false: colors.surface3 }} thumbColor="#fff" />
    </View>
  );
}
