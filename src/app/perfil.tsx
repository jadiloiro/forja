import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, Platform, Switch, View } from 'react-native';

import { ActivityStep, BasicsStep, BodyStep, GoalStep, HealthStep, LevelStep, PriorityStep, ScheduleStep, TargetStep } from '../components/ProfileForm';
import { showDialog } from '../components/Dialog';
import { Button, Card, Chip, ChipRow, Field, Screen, SectionHeader, Stepper, T } from '../components/ui';
import { pickBackupFile, saveBackupFile } from '../lib/backupFile';
import { hcGranted, hcOpenSettings, hcRequest, hcStatus, insertTestData, PERMISSIONS } from '../lib/healthConnect';
import { pullWeights } from '../lib/healthSync';
import { computeTargets } from '../lib/nutrition';
import { draftErrors, fromDraft, ProfileDraft, toDraft } from '../lib/profileDraft';
import { playRestSound } from '../lib/restAlarm';
import { exactAlarmGranted, requestExactAlarm } from '../lib/restNotifications';
import { AVISO_SEG, REST_SOUNDS, restSoundOf } from '../lib/restSounds';
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
      <SectionHeader title="Meta" />
      <TargetStep d={d} set={set} />
      <SectionHeader title="Experiência" />
      <LevelStep d={d} set={set} />
      <SectionHeader title="Rotina" />
      <ScheduleStep d={d} set={set} />
      <SectionHeader title="Atividade no dia a dia" />
      <ActivityStep d={d} set={set} />
      <SectionHeader title="Saúde" />
      <HealthStep d={d} set={set} />
      <SectionHeader title="Corpo" />
      <BodyStep d={d} set={set} />
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
          {preview.avisos.map((linha) => (
            <T key={linha} v="small" style={{ color: colors.warn, marginTop: 4 }}>
              {linha}
            </T>
          ))}
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
        <ToggleRow label="Tocar som no fim do descanso" value={settings.somDescanso ?? true} onChange={(v) => updateSettings({ somDescanso: v })} />
        {restSoundOf(settings) && (
          <View style={{ gap: space.sm }}>
            <T v="small">Toque para ouvir e escolher:</T>
            <ChipRow>
              {REST_SOUNDS.map((s) => (
                <Chip
                  key={s.id}
                  label={s.nome}
                  selected={restSoundOf(settings) === s.id}
                  onPress={() => {
                    updateSettings({ somDescansoId: s.id });
                    playRestSound(s.id);
                  }}
                />
              ))}
            </ChipRow>
          </View>
        )}
        <ToggleRow
          label={`Avisar ${AVISO_SEG} segundos antes`}
          hint="Um toque curto para você se preparar para a próxima série."
          value={settings.avisoDezSeg ?? false}
          onChange={(v) => updateSettings({ avisoDezSeg: v })}
        />
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

      {Platform.OS === 'android' && <Integracoes />}

      <SectionHeader title="Backup dos dados" />
      <Card style={{ gap: space.md }}>
        <T v="small">Seus dados ficam só neste aparelho. Salve um arquivo de backup no Drive, e-mail ou WhatsApp para não perder o histórico. O arquivo inclui medicamentos e condições de saúde, se você os informou: guarde em um lugar de confiança.</T>
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

const ROTULOS: Record<string, string> = {
  'read:Weight': 'Ler peso',
  'read:HeartRate': 'Ler frequência cardíaca',
  'read:SleepSession': 'Ler sono',
  'read:Steps': 'Ler passos',
  'write:ExerciseSession': 'Gravar treinos',
  'write:Nutrition': 'Gravar refeições',
};

/** Samsung Health e Galaxy Fit3, pelo Health Connect. Desligado por padrão. */
function Integracoes() {
  const ligado = useStore((s) => !!s.settings.healthConnect);
  const updateSettings = useStore((s) => s.updateSettings);
  const [granted, setGranted] = useState<Set<string>>();
  const [busy, setBusy] = useState(false);

  // As permissões podem ser revogadas no Health Connect com o Forja aberto ao fundo.
  useEffect(() => {
    if (!ligado) return;
    const check = () => hcGranted().then(setGranted).catch(() => {});
    check();
    const sub = AppState.addEventListener('change', (st) => st === 'active' && check());
    return () => sub.remove();
  }, [ligado]);

  const ligar = async () => {
    const status = await hcStatus();
    if (status === 'atualizar') {
      return showDialog('Atualize o Health Connect', 'Atualize o app Health Connect pela Play Store e tente de novo.');
    }
    if (status === 'indisponivel') {
      return showDialog(
        'Health Connect indisponível',
        'A integração precisa do APK do Forja (não funciona no Expo Go) e do Health Connect, que já vem no Android 14 ou mais novo.',
      );
    }
    setBusy(true);
    try {
      const ok = await hcRequest();
      setGranted(ok);
      if (!ok.size) return showDialog('Nenhuma permissão concedida', 'A integração continua desligada.');
      updateSettings({ healthConnect: true });
    } catch (e) {
      showDialog('Não foi possível conectar', e instanceof Error ? e.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  const faltando = granted ? PERMISSIONS.map((p) => `${p.accessType}:${p.recordType}`).filter((k) => !granted.has(k)) : [];

  return (
    <>
      <SectionHeader title="Integrações" />
      <Card style={{ gap: space.md }}>
        <ToggleRow
          label="Samsung Health e relógio"
          hint="Pelo Health Connect: lê peso, frequência cardíaca, sono e passos, e grava seus treinos e refeições."
          value={ligado}
          onChange={(v) => (v ? ligar() : updateSettings({ healthConnect: false }))}
        />
        {ligado && (
          <>
            {faltando.length > 0 && (
              <T v="small" style={{ color: colors.warn }}>
                Sem permissão para: {faltando.map((k) => ROTULOS[k].toLowerCase()).join(', ')}.
              </T>
            )}
            <T v="small">
              Os dados do relógio chegam depois que ele sincroniza com o Samsung Health. Passos e calorias gastas aparecem só como
              informação e não mudam sua meta de calorias.
            </T>
            <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
              <Button
                small
                variant="secondary"
                icon="sync-outline"
                title="Buscar peso agora"
                loading={busy}
                onPress={async () => {
                  setBusy(true);
                  try {
                    const n = await pullWeights();
                    showDialog(n ? `${n} ${n > 1 ? 'pesos importados' : 'peso importado'}` : 'Nenhum peso novo', undefined);
                  } catch (e) {
                    showDialog('Não foi possível ler o peso', e instanceof Error ? e.message : undefined);
                  } finally {
                    setBusy(false);
                  }
                }}
              />
              {faltando.length > 0 && <Button small variant="secondary" icon="key-outline" title="Conceder permissões" onPress={ligar} />}
            </View>
          </>
        )}
        <Button small variant="ghost" icon="open-outline" title="Gerenciar ou revogar permissões" onPress={hcOpenSettings} />
        <Button small variant="ghost" title="TESTE: inserir dados falsos" onPress={() => insertTestData(useStore.getState().history[0]).then((r) => showDialog('Dados inseridos', r), (e) => showDialog('Erro', String(e)))} />
      </Card>
    </>
  );
}
