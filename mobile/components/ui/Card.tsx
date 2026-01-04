import React from 'react';
import { View, StyleSheet, Pressable, ViewStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, borderRadius, shadows, spacing } from '../../lib/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface CardProps {
    children: React.ReactNode;
    onPress?: () => void;
    variant?: 'default' | 'glass' | 'bordered';
    borderLeftColor?: string;
    style?: ViewStyle;
    noPadding?: boolean;
}

export function Card({
    children,
    onPress,
    variant = 'default',
    borderLeftColor,
    style,
    noPadding = false,
}: CardProps) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        if (onPress) {
            scale.value = withSpring(0.98, { damping: 15 });
        }
    };

    const handlePressOut = () => {
        if (onPress) {
            scale.value = withSpring(1, { damping: 15 });
        }
    };

    const handlePress = async () => {
        if (onPress) {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress();
        }
    };

    const variantStyles = {
        default: {
            backgroundColor: colors.white,
            ...shadows.md,
        },
        glass: {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderWidth: 1,
            borderColor: 'rgba(34, 197, 94, 0.2)',
            ...shadows.lg,
        },
        bordered: {
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: colors.gray[200],
        },
    };

    const cardStyle = [
        styles.card,
        variantStyles[variant],
        !noPadding && styles.padding,
        borderLeftColor && { borderLeftWidth: 4, borderLeftColor },
        style,
    ];

    if (onPress) {
        return (
            <AnimatedPressable
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={[animatedStyle, ...cardStyle]}
            >
                {children}
            </AnimatedPressable>
        );
    }

    return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
    card: {
        borderRadius: borderRadius['2xl'],
        overflow: 'hidden',
    },
    padding: {
        padding: spacing.xl,
    },
});

export default Card;
