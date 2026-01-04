import React from 'react';
import {
    Pressable,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
    View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import { colors, borderRadius, shadows } from '../../lib/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface ButtonProps {
    title: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
    variant?: 'solid' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    style?: ViewStyle;
    textStyle?: TextStyle;
    fullWidth?: boolean;
}

export function Button({
    title,
    onPress,
    loading = false,
    disabled = false,
    variant = 'solid',
    size = 'md',
    icon,
    iconPosition = 'left',
    style,
    textStyle,
    fullWidth = true,
}: ButtonProps) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.96, { damping: 15 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { damping: 15 });
    };

    const handlePress = async () => {
        if (disabled || loading) return;
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
    };

    const sizeStyles = {
        sm: { height: 40, paddingHorizontal: 16, fontSize: 14 },
        md: { height: 52, paddingHorizontal: 24, fontSize: 16 },
        lg: { height: 56, paddingHorizontal: 32, fontSize: 18 },
    };

    const currentSize = sizeStyles[size];

    if (variant === 'outline') {
        return (
            <AnimatedPressable
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || loading}
                style={[
                    animatedStyle,
                    styles.button,
                    styles.outlineButton,
                    { height: currentSize.height, paddingHorizontal: currentSize.paddingHorizontal },
                    fullWidth && styles.fullWidth,
                    (disabled || loading) && styles.disabled,
                    style,
                ]}
            >
                {loading ? (
                    <ActivityIndicator color={colors.primary[500]} />
                ) : (
                    <View style={styles.contentRow}>
                        {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
                        <Text style={[styles.outlineText, { fontSize: currentSize.fontSize }, textStyle]}>
                            {title}
                        </Text>
                        {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
                    </View>
                )}
            </AnimatedPressable>
        );
    }

    if (variant === 'ghost') {
        return (
            <AnimatedPressable
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || loading}
                style={[
                    animatedStyle,
                    styles.button,
                    styles.ghostButton,
                    { height: currentSize.height, paddingHorizontal: currentSize.paddingHorizontal },
                    fullWidth && styles.fullWidth,
                    (disabled || loading) && styles.disabled,
                    style,
                ]}
            >
                {loading ? (
                    <ActivityIndicator color={colors.primary[500]} />
                ) : (
                    <View style={styles.contentRow}>
                        {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
                        <Text style={[styles.ghostText, { fontSize: currentSize.fontSize }, textStyle]}>
                            {title}
                        </Text>
                        {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
                    </View>
                )}
            </AnimatedPressable>
        );
    }

    // Solid (default)
    return (
        <AnimatedPressable
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled || loading}
            style={[
                animatedStyle,
                styles.button,
                shadows.primary,
                { height: currentSize.height },
                fullWidth && styles.fullWidth,
                (disabled || loading) && styles.disabled,
                style,
            ]}
        >
            <LinearGradient
                colors={[colors.primary[500], colors.primary[400]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.gradient, { paddingHorizontal: currentSize.paddingHorizontal }]}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <View style={styles.contentRow}>
                        {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
                        <Text style={[styles.solidText, { fontSize: currentSize.fontSize }, textStyle]}>
                            {title}
                        </Text>
                        {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
                    </View>
                )}
            </LinearGradient>
        </AnimatedPressable>
    );
}

const styles = StyleSheet.create({
    button: {
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
    },
    fullWidth: {
        width: '100%',
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconLeft: {
        marginRight: 8,
    },
    iconRight: {
        marginLeft: 8,
    },
    solidText: {
        color: '#fff',
        fontWeight: '700',
    },
    outlineButton: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: colors.primary[500],
        justifyContent: 'center',
        alignItems: 'center',
    },
    outlineText: {
        color: colors.primary[600],
        fontWeight: '600',
    },
    ghostButton: {
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    ghostText: {
        color: colors.primary[600],
        fontWeight: '600',
    },
    disabled: {
        opacity: 0.5,
    },
});

export default Button;
