import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProfileTheme } from '../../contexts/ProfileThemeContext';
import { DeliveryAreaGuard } from '../../components/ProfileRouteGuard';

export default function DeliveryTabLayout() {
  const theme = useProfileTheme();

  return (
    <DeliveryAreaGuard>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.tabBarActive,
          tabBarInactiveTintColor: '#737373',
          tabBarStyle: { paddingBottom: 8, paddingTop: 8, height: 60 },
          tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Entregas', tabBarIcon: ({ color, size }) => <Ionicons name="bicycle" size={size} color={color} /> }} />
        <Tabs.Screen name="routes" options={{ title: 'Rotas', tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} /> }} />
        <Tabs.Screen name="earnings" options={{ title: 'Ganhos', tabBarIcon: ({ color, size }) => <Ionicons name="wallet" size={size} color={color} /> }} />
        <Tabs.Screen name="history" options={{ title: 'Histórico', tabBarIcon: ({ color, size }) => <Ionicons name="time" size={size} color={color} /> }} />
      </Tabs>
    </DeliveryAreaGuard>
  );
}
