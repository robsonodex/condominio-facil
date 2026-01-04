import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Home, Bell, DollarSign, Calendar, User, MessageCircle, Camera } from 'lucide-react-native';
import { colors, spacing, shadows } from '../../lib/theme';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.primary[500],
                tabBarInactiveTintColor: colors.gray[400],
                tabBarStyle: styles.tabBar,
                tabBarLabelStyle: styles.tabBarLabel,
                tabBarItemStyle: styles.tabBarItem,
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Início',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={styles.iconContainer}>
                            <Home size={24} color={color} />
                            {focused && <View style={styles.activeIndicator} />}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="financeiro"
                options={{
                    title: 'Financeiro',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={styles.iconContainer}>
                            <DollarSign size={24} color={color} />
                            {focused && <View style={styles.activeIndicator} />}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="portaria/index"
                options={{
                    title: 'Portaria',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={styles.iconContainer}>
                            <Camera size={24} color={color} />
                            {focused && <View style={styles.activeIndicator} />}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="chat/index"
                options={{
                    title: 'Chat',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={styles.iconContainer}>
                            <MessageCircle size={24} color={color} />
                            {focused && <View style={styles.activeIndicator} />}
                            <View style={styles.badge}>
                                <View style={styles.badgeDot} />
                            </View>
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="perfil"
                options={{
                    title: 'Perfil',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={styles.iconContainer}>
                            <User size={24} color={color} />
                            {focused && <View style={styles.activeIndicator} />}
                        </View>
                    ),
                }}
            />
            {/* Hidden tabs */}
            <Tabs.Screen name="avisos/index" options={{ href: null }} />
            <Tabs.Screen name="ocorrencias/index" options={{ href: null }} />
            <Tabs.Screen name="reservas/index" options={{ href: null }} />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: colors.white,
        borderTopWidth: 0,
        height: Platform.OS === 'ios' ? 88 : 64,
        paddingTop: spacing.sm,
        ...shadows.lg,
    },
    tabBarLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
    },
    tabBarItem: {
        paddingVertical: spacing.xs,
    },
    iconContainer: {
        alignItems: 'center',
        position: 'relative',
    },
    activeIndicator: {
        position: 'absolute',
        top: -8,
        width: 20,
        height: 3,
        backgroundColor: colors.primary[500],
        borderRadius: 2,
    },
    badge: {
        position: 'absolute',
        top: -2,
        right: -8,
    },
    badgeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.error[500],
    },
});
