import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    TextInput as RNTextInput,
    Text,
    StyleSheet,
    Animated,
    Pressable,
    ViewStyle,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { colors, borderRadius, spacing } from '../../lib/theme';

export interface TextInputProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    secureTextEntry?: boolean;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    error?: string;
    icon?: React.ReactNode;
    editable?: boolean;
    multiline?: boolean;
    numberOfLines?: number;
    style?: ViewStyle;
}

export function TextInput({
    label,
    value,
    onChangeText,
    placeholder,
    secureTextEntry = false,
    keyboardType = 'default',
    autoCapitalize = 'sentences',
    error,
    icon,
    editable = true,
    multiline = false,
    numberOfLines = 1,
    style,
}: TextInputProps) {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(labelAnim, {
            toValue: isFocused || value ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [isFocused, value]);

    const labelStyle = {
        top: labelAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [18, 6],
        }),
        fontSize: labelAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [16, 12],
        }),
        color: labelAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [colors.gray[400], isFocused ? colors.primary[500] : colors.gray[500]],
        }),
    };

    const borderColor = error
        ? colors.error[500]
        : isFocused
            ? colors.primary[500]
            : colors.gray[200];

    return (
        <View style={[styles.container, style]}>
            <View
                style={[
                    styles.inputContainer,
                    { borderColor },
                    isFocused && styles.focused,
                    error && styles.errorBorder,
                ]}
            >
                {icon && <View style={styles.iconContainer}>{icon}</View>}

                <View style={styles.inputWrapper}>
                    <Animated.Text style={[styles.label, labelStyle]}>{label}</Animated.Text>
                    <RNTextInput
                        style={[
                            styles.input,
                            icon && styles.inputWithIcon,
                            multiline && styles.multilineInput,
                        ]}
                        value={value}
                        onChangeText={onChangeText}
                        placeholder={isFocused ? placeholder : ''}
                        placeholderTextColor={colors.gray[400]}
                        secureTextEntry={secureTextEntry && !showPassword}
                        keyboardType={keyboardType}
                        autoCapitalize={autoCapitalize}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        editable={editable}
                        multiline={multiline}
                        numberOfLines={numberOfLines}
                    />
                </View>

                {secureTextEntry && (
                    <Pressable
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeButton}
                        hitSlop={8}
                    >
                        {showPassword ? (
                            <EyeOff size={20} color={colors.gray[400]} />
                        ) : (
                            <Eye size={20} color={colors.gray[400]} />
                        )}
                    </Pressable>
                )}
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.lg,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.white,
        minHeight: 56,
        paddingHorizontal: spacing.lg,
    },
    focused: {
        shadowColor: colors.primary[500],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 2,
    },
    errorBorder: {
        borderColor: colors.error[500],
    },
    iconContainer: {
        marginRight: spacing.md,
    },
    inputWrapper: {
        flex: 1,
        position: 'relative',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
    },
    label: {
        position: 'absolute',
        left: 0,
        backgroundColor: colors.white,
        paddingHorizontal: 4,
        zIndex: 1,
    },
    input: {
        fontSize: 16,
        color: colors.gray[900],
        paddingTop: spacing.md,
        paddingBottom: spacing.xs,
    },
    inputWithIcon: {
        paddingLeft: 0,
    },
    multilineInput: {
        textAlignVertical: 'top',
        minHeight: 80,
    },
    eyeButton: {
        padding: spacing.xs,
        marginLeft: spacing.sm,
    },
    errorText: {
        color: colors.error[500],
        fontSize: 12,
        marginTop: spacing.xs,
        marginLeft: spacing.xs,
    },
});

export default TextInput;
