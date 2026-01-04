import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Animated,
    RefreshControl,
    Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
    Home as HomeIcon,
    Bell,
    DollarSign,
    Calendar,
    Package,
    MessageCircle,
    ChevronRight,
    Building2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Card } from '../../components/ui';
import { colors, spacing, shadows, borderRadius } from '../../lib/theme';
import { useAuthStore } from '../../lib/store';

export default function Home() {
    const { user } = useAuthStore();
    const [refreshing, setRefreshing] = React.useState(false);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // TODO: Fetch data
        setTimeout(() => setRefreshing(false), 1500);
    };

    const kpiCards = [
        { id: 'avisos', label: 'Avisos', value: '3', sublabel: 'Novos', color: colors.error[500], icon: Bell },
        { id: 'financeiro', label: 'Pendente', value: 'R$ 0', sublabel: 'Em dia', color: colors.primary[500], icon: DollarSign },
        { id: 'encomendas', label: 'Encomendas', value: '1', sublabel: 'Chegou', color: colors.warning[500], icon: Package },
    ];

    const quickActions = [
        { id: 'reservas', label: 'Reservar', icon: Calendar, color: colors.primary[500], route: '/(tabs)/reservas' },
        { id: 'financeiro', label: 'Pagar', icon: DollarSign, color: colors.primary[600], route: '/(tabs)/financeiro' },
        { id: 'encomendas', label: 'Encomendas', icon: Package, color: colors.warning[500], route: '/(tabs)/home' },
        { id: 'chat', label: 'Chat', icon: MessageCircle, color: colors.secondary[500], route: '/(tabs)/home' },
    ];

    const recentNotices = [
        { id: '1', title: 'Manutenção do Elevador', description: 'Elevador social ficará em manutenção dia 10/01', time: 'há 2 horas', urgent: true },
        { id: '2', title: 'Reunião de Condomínio', description: 'Assembleia extraordinária no dia 15/01', time: 'há 5 horas', urgent: false },
    ];

    const handleQuickAction = async (route: string) => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push(route as any);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary[500]}
                        colors={[colors.primary[500]]}
                    />
                }
            >
                {/* Header */}
                <Animated.View
                    style={[
                        styles.header,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    <View style={styles.headerContent}>
                        <View style={styles.avatarContainer}>
                            <Text style={styles.avatarText}>
                                {user?.nome?.charAt(0) || 'U'}
                            </Text>
                        </View>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.greeting}>
                                Olá, {user?.nome?.split(' ')[0] || 'Usuário'} 👋
                            </Text>
                            <View style={styles.condoInfo}>
                                <Building2 size={14} color={colors.white} style={{ opacity: 0.8 }} />
                                <Text style={styles.condoName}>Bloco A - Apto 301</Text>
                            </View>
                        </View>
                        <Pressable style={styles.notificationButton}>
                            <Bell size={24} color={colors.white} />
                            <View style={styles.notificationBadge}>
                                <Text style={styles.notificationBadgeText}>3</Text>
                            </View>
                        </Pressable>
                    </View>
                </Animated.View>

                {/* KPI Cards */}
                <Animated.View
                    style={[
                        styles.kpiContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    {kpiCards.map((kpi) => (
                        <Card key={kpi.id} variant="glass" style={styles.kpiCard} onPress={() => { }}>
                            <View style={[styles.kpiIconContainer, { backgroundColor: `${kpi.color}20` }]}>
                                <kpi.icon size={20} color={kpi.color} />
                            </View>
                            <Text style={styles.kpiValue}>{kpi.value}</Text>
                            <Text style={styles.kpiLabel}>{kpi.sublabel}</Text>
                        </Card>
                    ))}
                </Animated.View>

                {/* Quick Actions */}
                <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
                    <Text style={styles.sectionTitle}>⚡ Ações Rápidas</Text>
                    <View style={styles.quickActionsGrid}>
                        {quickActions.map((action) => (
                            <Pressable
                                key={action.id}
                                style={styles.quickActionItem}
                                onPress={() => handleQuickAction(action.route)}
                            >
                                <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}15` }]}>
                                    <action.icon size={28} color={action.color} />
                                </View>
                                <Text style={styles.quickActionLabel}>{action.label}</Text>
                            </Pressable>
                        ))}
                    </View>
                </Animated.View>

                {/* Recent Notices */}
                <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>📢 Últimos Avisos</Text>
                        <Pressable style={styles.seeAllButton}>
                            <Text style={styles.seeAllText}>Ver todos</Text>
                            <ChevronRight size={16} color={colors.primary[500]} />
                        </Pressable>
                    </View>

                    {recentNotices.map((notice) => (
                        <Card
                            key={notice.id}
                            variant="default"
                            borderLeftColor={notice.urgent ? colors.error[500] : colors.primary[500]}
                            style={styles.noticeCard}
                            onPress={() => router.push('/(tabs)/avisos')}
                        >
                            <View style={styles.noticeContent}>
                                <View style={[
                                    styles.noticeIconContainer,
                                    { backgroundColor: notice.urgent ? colors.error[100] : colors.primary[100] }
                                ]}>
                                    <Bell size={18} color={notice.urgent ? colors.error[500] : colors.primary[500]} />
                                </View>
                                <View style={styles.noticeTextContainer}>
                                    <Text style={styles.noticeTitle}>{notice.title}</Text>
                                    <Text style={styles.noticeDescription} numberOfLines={1}>
                                        {notice.description}
                                    </Text>
                                    <Text style={styles.noticeTime}>{notice.time}</Text>
                                </View>
                            </View>
                        </Card>
                    ))}
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.gray[50],
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: spacing['4xl'],
    },
    header: {
        backgroundColor: colors.primary[500],
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing['2xl'],
        borderBottomLeftRadius: borderRadius['2xl'],
        borderBottomRightRadius: borderRadius['2xl'],
        ...shadows.lg,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 56,
        height: 56,
        borderRadius: borderRadius.lg,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.lg,
    },
    avatarText: {
        color: colors.white,
        fontSize: 24,
        fontWeight: '700',
    },
    headerTextContainer: {
        flex: 1,
    },
    greeting: {
        color: colors.white,
        fontSize: 22,
        fontWeight: '700',
    },
    condoInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.xs,
    },
    condoName: {
        color: colors.white,
        opacity: 0.9,
        marginLeft: spacing.xs,
        fontSize: 14,
    },
    notificationButton: {
        width: 44,
        height: 44,
        borderRadius: borderRadius.md,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    notificationBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: colors.error[500],
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.primary[500],
    },
    notificationBadgeText: {
        color: colors.white,
        fontSize: 10,
        fontWeight: '700',
    },
    kpiContainer: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        marginTop: -spacing['2xl'],
        gap: spacing.md,
    },
    kpiCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.md,
    },
    kpiIconContainer: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    kpiValue: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.gray[900],
    },
    kpiLabel: {
        fontSize: 12,
        color: colors.gray[500],
        marginTop: 2,
    },
    section: {
        paddingHorizontal: spacing.xl,
        marginTop: spacing['2xl'],
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.gray[900],
        marginBottom: spacing.lg,
    },
    seeAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    seeAllText: {
        color: colors.primary[500],
        fontSize: 14,
        fontWeight: '600',
    },
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.lg,
    },
    quickActionItem: {
        width: '22%',
        alignItems: 'center',
    },
    quickActionIcon: {
        width: 60,
        height: 60,
        borderRadius: borderRadius.xl,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    quickActionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.gray[700],
        textAlign: 'center',
    },
    noticeCard: {
        marginBottom: spacing.md,
    },
    noticeContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    noticeIconContainer: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    noticeTextContainer: {
        flex: 1,
    },
    noticeTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.gray[900],
        marginBottom: 4,
    },
    noticeDescription: {
        fontSize: 13,
        color: colors.gray[600],
        marginBottom: 4,
    },
    noticeTime: {
        fontSize: 11,
        color: colors.gray[400],
    },
});
