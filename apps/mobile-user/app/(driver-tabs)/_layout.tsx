import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProfileTheme } from '../../contexts/ProfileThemeContext';
import { DriverAreaGuard } from '../../components/ProfileRouteGuard';

export default function DriverTabLayout() {
  const theme = useProfileTheme();

  return (
    <DriverAreaGuard>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.tabBarActive,
          tabBarInactiveTintColor: '#737373',
          tabBarStyle: { paddingBottom: 8, paddingTop: 8, height: 60 },
          tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }} />
        <Tabs.Screen name="earnings" options={{ title: 'Ganhos', tabBarIcon: ({ color, size }) => <Ionicons name="wallet" size={size} color={color} /> }} />
        <Tabs.Screen name="history" options={{ title: 'Histórico', tabBarIcon: ({ color, size }) => <Ionicons name="time" size={size} color={color} /> }} />
        <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }} />
      </Tabs>
    </DriverAreaGuard>
  );
}
