import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Animated,
    RefreshControl,
    Pressable,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    TextInput as RNTextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    Send,
    Smile,
    User,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { colors, spacing, borderRadius, shadows } from '../../../lib/theme';
import { useAuthStore } from '../../../lib/store';

interface Message {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    timestamp: Date;
    isOwn: boolean;
}

export default function Chat() {
    const { user } = useAuthStore();
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const flatListRef = useRef<FlatList>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Mock messages
    useEffect(() => {
        const mockMessages: Message[] = [
            { id: '1', text: 'Olá! Alguém viu meu gato? Ele fugiu ontem à noite 😢', senderId: 'user2', senderName: 'Maria Silva', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), isOwn: false },
            { id: '2', text: 'Não vi hoje, mas vou ficar de olho! É aquele laranja?', senderId: 'user1', senderName: 'Você', timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000), isOwn: true },
            { id: '3', text: 'Sim, laranja com manchas brancas. Nome dele é Mango 🐱', senderId: 'user2', senderName: 'Maria Silva', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), isOwn: false },
            { id: '4', text: 'Se alguém ver ele por favor me avisem!', senderId: 'user2', senderName: 'Maria Silva', timestamp: new Date(Date.now() - 45 * 60 * 1000), isOwn: false },
            { id: '5', text: 'Vou avisar o porteiro para ficar de olho', senderId: 'user3', senderName: 'João Carlos', timestamp: new Date(Date.now() - 30 * 60 * 1000), isOwn: false },
        ];
        setMessages(mockMessages);

        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, []);

    const handleSend = async () => {
        if (!message.trim()) return;

        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const newMessage: Message = {
            id: Date.now().toString(),
            text: message.trim(),
            senderId: user?.id || 'me',
            senderName: 'Você',
            timestamp: new Date(),
            isOwn: true,
        };

        setMessages(prev => [...prev, newMessage]);
        setMessage('');

        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const renderMessage = ({ item }: { item: Message }) => (
        <View style={[
            styles.messageContainer,
            item.isOwn ? styles.ownMessageContainer : styles.otherMessageContainer
        ]}>
            {!item.isOwn && (
                <View style={styles.avatarSmall}>
                    <User size={14} color={colors.gray[400]} />
                </View>
            )}
            <View style={[
                styles.messageBubble,
                item.isOwn ? styles.ownBubble : styles.otherBubble
            ]}>
                {!item.isOwn && (
                    <Text style={styles.senderName}>{item.senderName}</Text>
                )}
                <Text style={[
                    styles.messageText,
                    item.isOwn ? styles.ownText : styles.otherText
                ]}>
                    {item.text}
                </Text>
                <Text style={[
                    styles.messageTime,
                    item.isOwn ? styles.ownTime : styles.otherTime
                ]}>
                    {formatTime(item.timestamp)}
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <ChevronLeft size={24} color={colors.white} />
                </Pressable>
                <Text style={styles.headerTitle}>Chat dos Moradores</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
                keyboardVerticalOffset={0}
            >
                <Animated.View style={[styles.chatContainer, { opacity: fadeAnim }]}>
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.messagesList}
                        showsVerticalScrollIndicator={false}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                    />
                </Animated.View>

                {/* Input Area */}
                <View style={styles.inputArea}>
                    <View style={styles.inputContainer}>
                        <RNTextInput
                            style={styles.textInput}
                            placeholder="Digite sua mensagem..."
                            placeholderTextColor={colors.gray[400]}
                            value={message}
                            onChangeText={setMessage}
                            multiline
                            maxLength={500}
                        />
                        <Pressable style={styles.emojiButton}>
                            <Smile size={22} color={colors.gray[400]} />
                        </Pressable>
                    </View>
                    <Pressable
                        style={[
                            styles.sendButton,
                            message.trim() ? styles.sendButtonActive : styles.sendButtonInactive
                        ]}
                        onPress={handleSend}
                        disabled={!message.trim()}
                    >
                        <Send size={20} color={message.trim() ? colors.white : colors.gray[400]} />
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
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
    keyboardView: {
        flex: 1,
    },
    chatContainer: {
        flex: 1,
    },
    messagesList: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
    },
    messageContainer: {
        flexDirection: 'row',
        marginBottom: spacing.md,
    },
    ownMessageContainer: {
        justifyContent: 'flex-end',
    },
    otherMessageContainer: {
        justifyContent: 'flex-start',
    },
    avatarSmall: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.gray[200],
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
        marginTop: 4,
    },
    messageBubble: {
        maxWidth: '75%',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
    },
    ownBubble: {
        backgroundColor: colors.primary[100],
        borderBottomRightRadius: 4,
    },
    otherBubble: {
        backgroundColor: colors.white,
        borderBottomLeftRadius: 4,
        ...shadows.sm,
    },
    senderName: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.primary[600],
        marginBottom: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    ownText: {
        color: colors.gray[800],
    },
    otherText: {
        color: colors.gray[800],
    },
    messageTime: {
        fontSize: 10,
        marginTop: 4,
    },
    ownTime: {
        color: colors.gray[500],
        textAlign: 'right',
    },
    otherTime: {
        color: colors.gray[400],
    },
    inputArea: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: spacing.md,
        backgroundColor: colors.white,
        borderTopWidth: 1,
        borderTopColor: colors.gray[200],
        ...shadows.md,
    },
    inputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: colors.gray[100],
        borderRadius: borderRadius.xl,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        marginRight: spacing.sm,
    },
    textInput: {
        flex: 1,
        fontSize: 15,
        color: colors.gray[900],
        maxHeight: 100,
        paddingVertical: spacing.xs,
    },
    emojiButton: {
        padding: spacing.xs,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonActive: {
        backgroundColor: colors.primary[500],
    },
    sendButtonInactive: {
        backgroundColor: colors.gray[200],
    },
});
