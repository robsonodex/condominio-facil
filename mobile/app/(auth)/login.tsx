import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Animated,
    Alert,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { Mail, Lock, Fingerprint, Building2 } from 'lucide-react-native';
import { Button, TextInput } from '../../components/ui';
import { colors, spacing } from '../../lib/theme';
import { useAuthStore } from '../../lib/store';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const { signIn } = useAuthStore();

    // Animations
    const logoScale = useRef(new Animated.Value(0.8)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Entrance animation
        Animated.parallel([
            Animated.spring(logoScale, {
                toValue: 1,
                friction: 4,
                tension: 40,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();

        // Check biometric availability
        checkBiometricAvailability();
    }, []);

    const checkBiometricAvailability = async () => {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setBiometricAvailable(compatible && enrolled);
    };

    const validateForm = () => {
        const newErrors: { email?: string; password?: string } = {};

        if (!email.trim()) {
            newErrors.email = 'E-mail é obrigatório';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'E-mail inválido';
        }

        if (!password) {
            newErrors.password = 'Senha é obrigatória';
        } else if (password.length < 6) {
            newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            await signIn(email, password);
            router.replace('/(tabs)/home');
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Erro ao fazer login');
        } finally {
            setLoading(false);
        }
    };

    const handleBiometricAuth = async () => {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Autentique-se para continuar',
                fallbackLabel: 'Usar senha',
                disableDeviceFallback: false,
            });

            if (result.success) {
                // TODO: Implement stored credentials retrieval
                Alert.alert('Sucesso', 'Biometria validada! Implemente recuperação de credenciais salvas.');
            }
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível autenticar com biometria');
        }
    };

    const isFormValid = email.trim() && password.length >= 6;

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Logo Section */}
                    <Animated.View
                        style={[
                            styles.logoContainer,
                            {
                                transform: [{ scale: logoScale }],
                                opacity: fadeAnim,
                            },
                        ]}
                    >
                        <View style={styles.logoCircle}>
                            <Building2 size={48} color={colors.white} />
                        </View>
                        <View style={styles.brandContainer}>
                            <Text style={styles.brandPrefix}>Meu</Text>
                            <Text style={styles.brandName}>Condomínio Fácil</Text>
                        </View>
                        <Text style={styles.subtitle}>Acesso Seguro</Text>
                    </Animated.View>

                    {/* Form Section */}
                    <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
                        <TextInput
                            label="E-mail"
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                if (errors.email) setErrors({ ...errors, email: undefined });
                            }}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            icon={<Mail size={20} color={colors.gray[400]} />}
                            error={errors.email}
                        />

                        <TextInput
                            label="Senha"
                            value={password}
                            onChangeText={(text) => {
                                setPassword(text);
                                if (errors.password) setErrors({ ...errors, password: undefined });
                            }}
                            secureTextEntry
                            icon={<Lock size={20} color={colors.gray[400]} />}
                            error={errors.password}
                        />

                        <Button
                            title="ENTRAR"
                            onPress={handleLogin}
                            loading={loading}
                            disabled={!isFormValid}
                            size="lg"
                        />

                        {biometricAvailable && (
                            <>
                                <View style={styles.dividerContainer}>
                                    <View style={styles.dividerLine} />
                                    <Text style={styles.dividerText}>OU</Text>
                                    <View style={styles.dividerLine} />
                                </View>

                                <Button
                                    title="Entrar com Biometria"
                                    onPress={handleBiometricAuth}
                                    variant="outline"
                                    icon={<Fingerprint size={20} color={colors.primary[600]} />}
                                />
                            </>
                        )}

                        <Button
                            title="Esqueceu a senha?"
                            onPress={() => Alert.alert('Recuperar Senha', 'Funcionalidade em desenvolvimento')}
                            variant="ghost"
                            size="sm"
                            style={styles.forgotButton}
                        />
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.gray[50],
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: spacing['2xl'],
        paddingVertical: spacing['3xl'],
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: spacing['4xl'],
    },
    logoCircle: {
        width: 100,
        height: 100,
        borderRadius: 24,
        backgroundColor: colors.primary[500],
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
        shadowColor: colors.primary[500],
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
    },
    brandContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    brandPrefix: {
        fontSize: 16,
        color: colors.primary[500],
        fontWeight: '500',
        fontStyle: 'italic',
        marginRight: 4,
        transform: [{ rotate: '-8deg' }],
    },
    brandName: {
        fontSize: 26,
        fontWeight: '800',
        color: colors.gray[900],
    },
    subtitle: {
        fontSize: 14,
        color: colors.gray[500],
        marginTop: spacing.sm,
    },
    formContainer: {
        width: '100%',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: spacing.xl,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.gray[200],
    },
    dividerText: {
        color: colors.gray[400],
        paddingHorizontal: spacing.lg,
        fontSize: 12,
        fontWeight: '500',
    },
    forgotButton: {
        marginTop: spacing.lg,
    },
});
