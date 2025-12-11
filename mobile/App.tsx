import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PWA_URL = process.env.PWA_URL || 'https://seu-dominio.com';

export default function App() {
    useEffect(() => {
        const subscription = Linking.addEventListener('url', ({ url }) => {
            // handle deep link
            // postMessage to WebView if needed
        });
        return () => subscription.remove();
    }, []);

    useEffect(() => {
        async function register() {
            try {
                const token = (await Notifications.getExpoPushTokenAsync()).data;
                await AsyncStorage.setItem('push_token', token);
                await fetch(`${PWA_URL}/api/mobile/register-token`, {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ token }),
                });
            } catch (e) {
                console.error('push register', e);
            }
        }
        register();
    }, []);

    return (
        <WebView
            source={{ uri: PWA_URL }}
            originWhitelist={['*']}
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            startInLoadingState
            style={{ flex: 1 }}
        // pass cookies/localstorage bridging if needed
        />
    );
}
