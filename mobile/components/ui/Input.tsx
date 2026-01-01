import { View, TextInput, TouchableOpacity, TextInputProps, Text } from 'react-native'
import { ReactNode, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react-native'
import tw from 'twrnc'

interface InputProps extends TextInputProps {
    label?: string
    icon?: ReactNode
    error?: string
    isPassword?: boolean
    className?: any // For sanitization
}

export function Input({
    label,
    icon,
    error,
    isPassword,
    style,
    className, // Omit from native props
    ...props
}: InputProps) {
    const [showPassword, setShowPassword] = useState(false)

    return (
        <View style={[tw`w-full mb-4`, style]}>
            {label && <Text style={tw`text-sm font-medium text-gray-700 mb-1.5`}>{label}</Text>}

            <View style={tw.style(
                "flex-row items-center border rounded-xl bg-gray-50 px-3 h-12",
                error ? "border-red-500" : "border-gray-200"
                // focus handling is different in pure RN styles, omitting focus ring for simplicity or using state
            )}>
                {icon && <View style={tw`mr-3`}>{icon}</View>}

                <TextInput
                    style={tw`flex-1 text-gray-900 text-base`}
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!!(isPassword && !showPassword)}
                    autoCapitalize="none"
                    {...props}
                />

                {isPassword && (
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        {showPassword ? (
                            <EyeOff size={20} color="#6b7280" />
                        ) : (
                            <Eye size={20} color="#6b7280" />
                        )}
                    </TouchableOpacity>
                )}
            </View>

            {error && <Text style={tw`text-xs text-red-500 mt-1`}>{error}</Text>}
        </View>
    )
}
