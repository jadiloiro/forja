import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { ColorValue } from 'react-native';

import { IconName } from '../../components/ui';
import { useStore } from '../../store/useStore';
import { colors } from '../../theme';

type TabIconProps = { color: ColorValue; focused: boolean; size: number };

function TabIcon({ name, active, color, focused, size }: TabIconProps & { name: IconName; active: IconName }) {
  return <Ionicons name={focused ? active : name} color={color as string} size={size - 2} />;
}

function icon(name: IconName, active: IconName) {
  function Icon(props: TabIconProps) {
    return <TabIcon name={name} active={active} {...props} />;
  }
  return Icon;
}

export default function TabsLayout() {
  const hasProfile = useStore((s) => !!s.profile);
  if (!hasProfile) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMute,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Hoje', tabBarIcon: icon('flame-outline', 'flame') }} />
      <Tabs.Screen name="treinos" options={{ title: 'Treinos', tabBarIcon: icon('barbell-outline', 'barbell') }} />
      <Tabs.Screen name="exercicios" options={{ title: 'Exercícios', tabBarIcon: icon('body-outline', 'body') }} />
      <Tabs.Screen name="nutricao" options={{ title: 'Nutrição', tabBarIcon: icon('nutrition-outline', 'nutrition') }} />
      <Tabs.Screen name="progresso" options={{ title: 'Progresso', tabBarIcon: icon('stats-chart-outline', 'stats-chart') }} />
    </Tabs>
  );
}
