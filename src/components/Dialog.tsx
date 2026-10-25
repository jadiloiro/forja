import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { create } from 'zustand';

import { colors, radius, space } from '../theme';
import { Button, T } from './ui';

export type DialogButton = { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void };

type DialogState = { title: string; message?: string; buttons: DialogButton[] } | null;

const useDialog = create<{ current: DialogState }>(() => ({ current: null }));

// Mesma assinatura do Alert.alert, mas funciona também na web e segue o tema do app.
export function showDialog(title: string, message?: string, buttons?: DialogButton[]) {
  useDialog.setState({ current: { title, message, buttons: buttons?.length ? buttons : [{ text: 'OK' }] } });
}

export function DialogHost() {
  const current = useDialog((s) => s.current);
  const close = () => useDialog.setState({ current: null });
  const cancel = current?.buttons.find((b) => b.style === 'cancel');

  const press = (b: DialogButton) => {
    close();
    b.onPress?.();
  };

  // Botão de cancelar vai primeiro (à esquerda); com 3+ botões, empilha.
  const ordered = current ? [...current.buttons].sort((a, b) => Number(b.style === 'cancel') - Number(a.style === 'cancel')) : [];
  const stacked = ordered.length > 2;

  return (
    <Modal visible={!!current} transparent animationType="fade" onRequestClose={() => (cancel ? press(cancel) : close())}>
      <Pressable style={styles.bg} onPress={() => cancel && press(cancel)}>
        <Pressable style={styles.box} onPress={() => {}}>
          <T v="h2">{current?.title}</T>
          {current?.message ? <T v="small" style={{ fontSize: 14, lineHeight: 20 }}>{current.message}</T> : null}
          <View style={[styles.actions, stacked && { flexDirection: 'column-reverse' }]}>
            {ordered.map((b) => (
              <Button
                key={b.text}
                title={b.text}
                variant={b.style === 'cancel' ? 'secondary' : b.style === 'destructive' ? 'danger' : 'primary'}
                style={stacked ? undefined : { flex: 1 }}
                onPress={() => press(b)}
              />
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: space.lg },
  box: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: space.xl,
    gap: space.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
});
