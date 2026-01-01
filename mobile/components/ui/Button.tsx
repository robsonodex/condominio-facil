import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps } from 'react-native'
import tw from 'twrnc'

interface ButtonProps extends TouchableOpacityProps {
    title: string
    variant?: 'primary' | 'outline' | 'ghost'
    isLoading?: boolean
    className?: any // For sanitization
}

export function Button({
    title,
    variant = 'primary',
    isLoading,
    style,
    disabled,
    className, // Omit from native props
    ...props
}: ButtonProps) {
    const baseStyles = "h-12 rounded-xl flex-row justify-center items-center w-full"

    const variants = {
        primary: "bg-blue-600",
        outline: "bg-transparent border border-gray-300",
        ghost: "bg-transparent",
    }

    const textStyles = {
        primary: "text-white font-bold text-base",
        outline: "text-gray-700 font-semibold text-base",
        ghost: "text-blue-600 font-medium text-sm",
    }

    return (
        <TouchableOpacity
            disabled={!!(isLoading || disabled)}
            style={[
                tw.style(
                    baseStyles,
                    variants[variant],
                    (isLoading || disabled) && "opacity-70"
                ),
                style
            ]}
            {...props}
        >
            {isLoading ? (
                <ActivityIndicator color={variant === 'primary' ? 'white' : '#4b5563'} />
            ) : (
                <Text style={tw`${textStyles[variant]}`}>{title}</Text>
            )}
        </TouchableOpacity>
    )
}
