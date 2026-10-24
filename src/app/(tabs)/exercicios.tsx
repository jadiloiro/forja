import { router } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExerciseBrowser } from '../../components/ExerciseBrowser';
import { IconButton, T } from '../../components/ui';
import { colors } from '../../theme';

export default function Exercicios() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ExerciseBrowser
        onPress={(e) => router.push({ pathname: '/exercicio/[id]', params: { id: e.id } })}
        header={
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <T v="display">Exercícios</T>
            <IconButton icon="add-circle-outline" size={26} color={colors.accent} label="Criar exercício" onPress={() => router.push('/novo-exercicio')} />
          </View>
        }
      />
    </SafeAreaView>
  );
}
