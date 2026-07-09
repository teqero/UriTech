import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProfileTheme } from '../../contexts/ProfileThemeContext';
import { VendorAreaGuard } from '../../components/ProfileRouteGuard';

export default function VendorTabLayout() {
  const theme = useProfileTheme();

  return (
    <VendorAreaGuard>
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
        <Tabs.Screen name="orders" options={{ title: 'Pedidos', tabBarIcon: ({ color, size }) => <Ionicons name="receipt" size={size} color={color} /> }} />
        <Tabs.Screen name="menu" options={{ title: 'Cardápio', tabBarIcon: ({ color, size }) => <Ionicons name="restaurant" size={size} color={color} /> }} />
        <Tabs.Screen name="profile" options={{ title: 'Mais', tabBarIcon: ({ color, size }) => <Ionicons name="ellipsis-horizontal" size={size} color={color} /> }} />
        <Tabs.Screen name="analytics" options={{ href: null }} />
      </Tabs>
    </VendorAreaGuard>
  );
}
