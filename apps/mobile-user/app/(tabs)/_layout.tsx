import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@uritech/shared';
import { CustomerAreaGuard } from '../../components/ProfileRouteGuard';
import { useProfileTheme } from '../../contexts/ProfileThemeContext';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const theme = useProfileTheme();
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'web' ? 12 : 4);
  const tabHeight = 56 + bottomPad;

  return (
    <CustomerAreaGuard>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.tabBarActive,
          tabBarInactiveTintColor: colors.gray500,
          tabBarStyle: {
            borderTopWidth: 1,
            borderTopColor: colors.gray100,
            paddingBottom: bottomPad,
            paddingTop: 6,
            height: tabHeight,
            minHeight: tabHeight,
          },
          tabBarItemStyle: { paddingVertical: 2 },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 2,
            marginBottom: Platform.OS === 'web' ? 2 : 0,
          },
          tabBarIconStyle: { marginTop: 2 },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }} />
        <Tabs.Screen name="activity" options={{ title: 'Atividade', tabBarIcon: ({ color, size }) => <Ionicons name="time" size={size} color={color} /> }} />
        <Tabs.Screen name="payment" options={{ title: 'Pagamento', tabBarIcon: ({ color, size }) => <Ionicons name="wallet" size={size} color={color} /> }} />
        <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }} />
      </Tabs>
    </CustomerAreaGuard>
  );
}
