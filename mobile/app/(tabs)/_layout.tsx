import { Tabs } from 'expo-router'
import { Home, Bell, AlertTriangle, Calendar, User } from 'lucide-react-native'

export default function TabLayout() {
    return (
        <Tabs screenOptions={{ tabBarActiveTintColor: '#2563eb' }}>
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Início',
                    tabBarIcon: ({ color }) => <Home size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="avisos/index"
                options={{
                    title: 'Avisos',
                    tabBarIcon: ({ color }) => <Bell size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="ocorrencias/index"
                options={{
                    title: 'Ocorrências',
                    tabBarIcon: ({ color }) => <AlertTriangle size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="reservas/index"
                options={{
                    title: 'Reservas',
                    tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="perfil"
                options={{
                    title: 'Perfil',
                    tabBarIcon: ({ color }) => <User size={24} color={color} />,
                }}
            />
        </Tabs>
    )
}
