import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Animated,
    RefreshControl,
    Pressable,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    DollarSign,
    CheckCircle,
    Clock,
    AlertCircle,
    ChevronLeft,
    FileText,
    QrCode,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Card, Button } from '../../components/ui';
import { colors, spacing, shadows, borderRadius } from '../../lib/theme';

interface Invoice {
    id: string;
    description: string;
    amount: number;
    dueDate: string;
    status: 'pago' | 'pendente' | 'vencido';
    paidAt?: string;
}

export default function Financeiro() {
    const [refreshing, setRefreshing] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Mock data
    const invoices: Invoice[] = [
        { id: '1', description: 'Taxa Condominial - Jan/2026', amount: 1250.00, dueDate: '2026-01-10', status: 'pago', paidAt: '2026-01-08' },
        { id: '2', description: 'Taxa Condominial - Fev/2026', amount: 980.00, dueDate: '2026-02-10', status: 'pendente' },
        { id: '3', description: 'Fundo de Reserva', amount: 150.00, dueDate: '2026-01-05', status: 'vencido' },
    ];

    const summary = {
        total: invoices.reduce((acc, inv) => acc + inv.amount, 0),
        paid: invoices.filter(i => i.status === 'pago').reduce((acc, inv) => acc + inv.amount, 0),
        pending: invoices.filter(i => i.status === 'pendente' || i.status === 'vencido').reduce((acc, inv) => acc + inv.amount, 0),
    };

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTimeout(() => setRefreshing(false), 1500);
    };

    const getStatusConfig = (status: Invoice['status']) => {
        switch (status) {
            case 'pago':
                return {
                    color: colors.primary[500],
                    bgColor: colors.primary[100],
                    icon: CheckCircle,
                    label: 'Pago',
                };
            case 'pendente':
                return {
                    color: colors.warning[500],
                    bgColor: colors.warning[100],
                    icon: Clock,
                    label: 'Pendente',
                };
            case 'vencido':
                return {
                    color: colors.error[500],
                    bgColor: colors.error[100],
                    icon: AlertCircle,
                    label: 'Vencido',
                };
        }
    };

    const handlePayment = async (invoice: Invoice, method: 'pix' | 'boleto') => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert(
            method === 'pix' ? 'Pagamento PIX' : 'Gerar Boleto',
            `${invoice.description}\nValor: R$ ${invoice.amount.toFixed(2)}`,
            [{ text: 'OK' }]
        );
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR');
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <ChevronLeft size={24} color={colors.white} />
                </Pressable>
                <Text style={styles.headerTitle}>Financeiro</Text>
                <View style={{ width: 40 }} />
            </View>

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
                {/* Summary Card */}
                <Animated.View style={[styles.summarySection, { opacity: fadeAnim }]}>
                    <Card variant="glass" style={styles.summaryCard}>
                        <View style={styles.summaryHeader}>
                            <DollarSign size={24} color={colors.primary[500]} />
                            <Text style={styles.summaryTitle}>Resumo do Mês</Text>
                        </View>
                        <Text style={styles.summaryTotal}>R$ {summary.total.toFixed(2)}</Text>
                        <View style={styles.summaryDetails}>
                            <View style={styles.summaryItem}>
                                <CheckCircle size={16} color={colors.primary[500]} />
                                <Text style={styles.summaryItemLabel}>Pago:</Text>
                                <Text style={[styles.summaryItemValue, { color: colors.primary[600] }]}>
                                    R$ {summary.paid.toFixed(2)}
                                </Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <Clock size={16} color={colors.warning[500]} />
                                <Text style={styles.summaryItemLabel}>Pendente:</Text>
                                <Text style={[styles.summaryItemValue, { color: colors.warning[600] }]}>
                                    R$ {summary.pending.toFixed(2)}
                                </Text>
                            </View>
                        </View>
                    </Card>
                </Animated.View>

                {/* Invoices List */}
                <Animated.View style={[styles.invoicesSection, { opacity: fadeAnim }]}>
                    <Text style={styles.sectionTitle}>📄 Faturas</Text>

                    {invoices.map((invoice) => {
                        const statusConfig = getStatusConfig(invoice.status);
                        const StatusIcon = statusConfig.icon;

                        return (
                            <Card
                                key={invoice.id}
                                variant="default"
                                borderLeftColor={statusConfig.color}
                                style={styles.invoiceCard}
                            >
                                <View style={styles.invoiceHeader}>
                                    <View style={styles.invoiceInfo}>
                                        <Text style={styles.invoiceId}>#{invoice.id.padStart(4, '0')}</Text>
                                        <Text style={styles.invoiceAmount}>
                                            R$ {invoice.amount.toFixed(2)}
                                        </Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                                        <StatusIcon size={14} color={statusConfig.color} />
                                        <Text style={[styles.statusText, { color: statusConfig.color }]}>
                                            {statusConfig.label}
                                        </Text>
                                    </View>
                                </View>

                                <Text style={styles.invoiceDescription}>{invoice.description}</Text>
                                <Text style={styles.invoiceDueDate}>Venc: {formatDate(invoice.dueDate)}</Text>

                                {invoice.status === 'pago' && invoice.paidAt && (
                                    <Text style={styles.paidInfo}>
                                        Pago em {formatDate(invoice.paidAt)}
                                    </Text>
                                )}

                                {invoice.status !== 'pago' && (
                                    <View style={styles.paymentActions}>
                                        <Pressable
                                            style={[styles.paymentButton, styles.pixButton]}
                                            onPress={() => handlePayment(invoice, 'pix')}
                                        >
                                            <QrCode size={16} color={colors.primary[600]} />
                                            <Text style={styles.pixButtonText}>Pagar PIX</Text>
                                        </Pressable>
                                        <Pressable
                                            style={[styles.paymentButton, styles.boletoButton]}
                                            onPress={() => handlePayment(invoice, 'boleto')}
                                        >
                                            <FileText size={16} color={colors.gray[600]} />
                                            <Text style={styles.boletoButtonText}>Boleto</Text>
                                        </Pressable>
                                    </View>
                                )}
                            </Card>
                        );
                    })}
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.primary[500],
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
        ...shadows.md,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: borderRadius.md,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.white,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: spacing['4xl'],
    },
    summarySection: {
        padding: spacing.xl,
    },
    summaryCard: {
        alignItems: 'center',
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.gray[700],
        marginLeft: spacing.sm,
    },
    summaryTotal: {
        fontSize: 32,
        fontWeight: '800',
        color: colors.gray[900],
        marginBottom: spacing.lg,
    },
    summaryDetails: {
        width: '100%',
        gap: spacing.sm,
    },
    summaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    summaryItemLabel: {
        fontSize: 14,
        color: colors.gray[600],
        marginLeft: spacing.sm,
        flex: 1,
    },
    summaryItemValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    invoicesSection: {
        paddingHorizontal: spacing.xl,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.gray[900],
        marginBottom: spacing.lg,
    },
    invoiceCard: {
        marginBottom: spacing.md,
    },
    invoiceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.sm,
    },
    invoiceInfo: {
        flex: 1,
    },
    invoiceId: {
        fontSize: 12,
        color: colors.gray[400],
        marginBottom: 2,
    },
    invoiceAmount: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.gray[900],
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: spacing.xs,
    },
    invoiceDescription: {
        fontSize: 14,
        color: colors.gray[700],
        marginBottom: spacing.xs,
    },
    invoiceDueDate: {
        fontSize: 12,
        color: colors.gray[500],
    },
    paidInfo: {
        fontSize: 12,
        color: colors.primary[600],
        marginTop: spacing.sm,
    },
    paymentActions: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.lg,
    },
    paymentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.full,
        flex: 1,
    },
    pixButton: {
        backgroundColor: colors.primary[100],
    },
    pixButtonText: {
        color: colors.primary[600],
        fontWeight: '600',
        fontSize: 13,
        marginLeft: spacing.xs,
    },
    boletoButton: {
        backgroundColor: colors.gray[100],
    },
    boletoButtonText: {
        color: colors.gray[600],
        fontWeight: '600',
        fontSize: 13,
        marginLeft: spacing.xs,
    },
});
