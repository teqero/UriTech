import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const VENDOR_RED = '#EE2737';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: VENDOR_RED,
      tabBarInactiveTintColor: '#737373',
      tabBarStyle: { paddingBottom: 8, paddingTop: 8, height: 60 },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }} />
      <Tabs.Screen name="orders" options={{ title: 'Pedidos', tabBarIcon: ({ color, size }) => <Ionicons name="receipt" size={size} color={color} /> }} />
      <Tabs.Screen name="menu" options={{ title: 'Cardápio', tabBarIcon: ({ color, size }) => <Ionicons name="restaurant" size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Mais', tabBarIcon: ({ color, size }) => <Ionicons name="ellipsis-horizontal" size={size} color={color} /> }} />
      <Tabs.Screen name="analytics" options={{ href: null }} />
    </Tabs>
  );
}
