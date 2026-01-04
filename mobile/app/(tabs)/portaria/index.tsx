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
import { Camera as ExpoCamera, CameraType, CameraView } from 'expo-camera';
import {
    ChevronLeft,
    Camera,
    User,
    Clock,
    CheckCircle,
    XCircle,
    Plus,
    ScanFace,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Card, Button } from '../../../components/ui';
import { colors, spacing, borderRadius, shadows } from '../../../lib/theme';

interface Visitor {
    id: string;
    name: string;
    status: 'authorized' | 'exited';
    time: string;
    photo?: string;
}

export default function Portaria() {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [showCamera, setShowCamera] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Mock visitors
    const [visitors] = useState<Visitor[]>([
        { id: '1', name: 'João da Silva', status: 'authorized', time: '14:30' },
        { id: '2', name: 'Maria Santos', status: 'exited', time: '15:00' },
        { id: '3', name: 'Carlos Pereira', status: 'authorized', time: '16:15' },
    ]);

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();

        (async () => {
            const { status } = await ExpoCamera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTimeout(() => setRefreshing(false), 1500);
    };

    const handleScan = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        if (!hasPermission) {
            Alert.alert('Permissão Necessária', 'Precisamos de acesso à câmera para o reconhecimento facial.');
            return;
        }

        setShowCamera(true);
    };

    const handleCapture = async () => {
        setScanning(true);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        // Simulate AI processing
        setTimeout(() => {
            setScanning(false);
            setShowCamera(false);
            Alert.alert(
                '✅ Visitante Identificado',
                'João da Silva\nAcesso autorizado pelo Apto 301',
                [{ text: 'OK' }]
            );
        }, 2000);
    };

    const handleManualEntry = () => {
        Alert.alert('Cadastro Manual', 'Funcionalidade em desenvolvimento');
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <ChevronLeft size={24} color={colors.white} />
                </Pressable>
                <Text style={styles.headerTitle}>Portaria</Text>
                <View style={{ width: 40 }} />
            </View>

            {showCamera ? (
                <View style={styles.cameraContainer}>
                    <CameraView
                        style={styles.camera}
                        facing="front"
                    >
                        {/* Overlay */}
                        <View style={styles.cameraOverlay}>
                            <View style={styles.scanFrame}>
                                {scanning && (
                                    <Animated.View style={styles.scanLine} />
                                )}
                            </View>
                            <Text style={styles.scanText}>
                                {scanning ? '🔍 Processando...' : '📹 Posicione o rosto no centro'}
                            </Text>
                        </View>

                        {/* Camera Controls */}
                        <View style={styles.cameraControls}>
                            <Pressable
                                style={styles.cancelButton}
                                onPress={() => setShowCamera(false)}
                            >
                                <XCircle size={24} color={colors.white} />
                                <Text style={styles.cancelText}>Cancelar</Text>
                            </Pressable>

                            <Pressable
                                style={[styles.captureButton, scanning && styles.captureButtonDisabled]}
                                onPress={handleCapture}
                                disabled={scanning}
                            >
                                <ScanFace size={32} color={colors.white} />
                            </Pressable>

                            <View style={{ width: 80 }} />
                        </View>
                    </CameraView>
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={colors.primary[500]}
                        />
                    }
                >
                    {/* Scan Section */}
                    <Animated.View style={[styles.scanSection, { opacity: fadeAnim }]}>
                        <Card variant="glass" style={styles.scanCard}>
                            <View style={styles.scanIconContainer}>
                                <ScanFace size={48} color={colors.purple[500]} />
                            </View>
                            <Text style={styles.scanTitle}>Reconhecimento Facial (AI)</Text>
                            <Text style={styles.scanDescription}>
                                Use a câmera para identificar visitantes automaticamente
                            </Text>
                            <Button
                                title="Escanear Rosto"
                                onPress={handleScan}
                                icon={<Camera size={20} color={colors.white} />}
                                style={styles.scanButton}
                            />
                        </Card>
                    </Animated.View>

                    {/* Recent Visitors */}
                    <Animated.View style={[styles.visitorsSection, { opacity: fadeAnim }]}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>🚗 Visitantes Recentes</Text>
                        </View>

                        {visitors.map((visitor) => (
                            <Card
                                key={visitor.id}
                                variant="default"
                                style={styles.visitorCard}
                                onPress={() => { }}
                            >
                                <View style={styles.visitorContent}>
                                    <View style={styles.visitorAvatar}>
                                        <User size={24} color={colors.gray[400]} />
                                    </View>
                                    <View style={styles.visitorInfo}>
                                        <Text style={styles.visitorName}>{visitor.name}</Text>
                                        <View style={styles.visitorStatus}>
                                            {visitor.status === 'authorized' ? (
                                                <>
                                                    <CheckCircle size={14} color={colors.primary[500]} />
                                                    <Text style={[styles.statusText, { color: colors.primary[600] }]}>
                                                        Autorizado
                                                    </Text>
                                                </>
                                            ) : (
                                                <>
                                                    <Clock size={14} color={colors.gray[400]} />
                                                    <Text style={[styles.statusText, { color: colors.gray[500] }]}>
                                                        Saiu
                                                    </Text>
                                                </>
                                            )}
                                        </View>
                                    </View>
                                    <Text style={styles.visitorTime}>{visitor.time}</Text>
                                </View>
                            </Card>
                        ))}

                        {/* Manual Entry Button */}
                        <Button
                            title="Registrar Visitante Manual"
                            onPress={handleManualEntry}
                            variant="outline"
                            icon={<Plus size={20} color={colors.primary[600]} />}
                            style={styles.manualButton}
                        />
                    </Animated.View>
                </ScrollView>
            )}
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
    scanSection: {
        padding: spacing.xl,
    },
    scanCard: {
        alignItems: 'center',
        paddingVertical: spacing['2xl'],
    },
    scanIconContainer: {
        width: 80,
        height: 80,
        borderRadius: borderRadius.xl,
        backgroundColor: colors.purple[100],
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    scanTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.gray[900],
        marginBottom: spacing.sm,
    },
    scanDescription: {
        fontSize: 14,
        color: colors.gray[500],
        textAlign: 'center',
        marginBottom: spacing.xl,
        paddingHorizontal: spacing.lg,
    },
    scanButton: {
        width: '100%',
    },
    visitorsSection: {
        paddingHorizontal: spacing.xl,
    },
    sectionHeader: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.gray[900],
    },
    visitorCard: {
        marginBottom: spacing.md,
    },
    visitorContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    visitorAvatar: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.md,
        backgroundColor: colors.gray[100],
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    visitorInfo: {
        flex: 1,
    },
    visitorName: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.gray[900],
        marginBottom: 4,
    },
    visitorStatus: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 4,
    },
    visitorTime: {
        fontSize: 14,
        color: colors.gray[500],
        fontWeight: '500',
    },
    manualButton: {
        marginTop: spacing.lg,
    },
    cameraContainer: {
        flex: 1,
    },
    camera: {
        flex: 1,
    },
    cameraOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    scanFrame: {
        width: 250,
        height: 300,
        borderWidth: 3,
        borderColor: colors.purple[400],
        borderRadius: borderRadius['2xl'],
        overflow: 'hidden',
    },
    scanLine: {
        position: 'absolute',
        width: '100%',
        height: 3,
        backgroundColor: colors.primary[400],
    },
    scanText: {
        marginTop: spacing.xl,
        fontSize: 16,
        color: colors.white,
        fontWeight: '600',
    },
    cameraControls: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
    },
    cancelButton: {
        width: 80,
        alignItems: 'center',
    },
    cancelText: {
        color: colors.white,
        fontSize: 12,
        marginTop: 4,
    },
    captureButton: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: colors.purple[500],
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: colors.white,
    },
    captureButtonDisabled: {
        opacity: 0.6,
    },
});
