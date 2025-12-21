import { useState, useEffect, useRef } from "react";
import { View, Alert, Platform } from "react-native";
import { WebView } from "react-native-webview";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

const PRODUCTION_URL = "https://www.meucondominiofacil.com/app";

// Configurar comportamento das notificações
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export default function App() {
    const [expoPushToken, setExpoPushToken] = useState<string>("");
    const notificationListener = useRef<any>();
    const responseListener = useRef<any>();
    const webViewRef = useRef<any>(null);

    useEffect(() => {
        // Registrar para notificações push
        registerForPushNotificationsAsync().then(token => {
            if (token) {
                setExpoPushToken(token);
                console.log("Push Token:", token);
            }
        });

        // Listener para notificações recebidas (app em foreground)
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            console.log("Notificação recebida:", notification);
            // Som é tocado automaticamente pela configuração acima
        });

        // Listener para quando usuário clica na notificação
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            console.log("Notificação clicada:", data);

            // Navegar para URL específica se houver
            if (data?.url && webViewRef.current) {
                webViewRef.current.injectJavaScript(`
                    window.location.href = '${data.url}';
                    true;
                `);
            }
        });

        return () => {
            if (notificationListener.current) {
                Notifications.removeNotificationSubscription(notificationListener.current);
            }
            if (responseListener.current) {
                Notifications.removeNotificationSubscription(responseListener.current);
            }
        };
    }, []);

    // Comunicação WebView -> App Nativo
    const handleMessage = (event: any) => {
        try {
            const message = JSON.parse(event.nativeEvent.data);

            if (message.type === "GET_PUSH_TOKEN") {
                // WebView solicitou o token
                webViewRef.current?.injectJavaScript(`
                    window.postMessage(JSON.stringify({
                        type: 'PUSH_TOKEN',
                        token: '${expoPushToken}'
                    }), '*');
                    true;
                `);
            }

            if (message.type === "SEND_LOCAL_NOTIFICATION") {
                // WebView quer enviar notificação local
                sendLocalNotification(message.title, message.body, message.data);
            }
        } catch (e) {
            console.log("Mensagem não-JSON do WebView:", event.nativeEvent.data);
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <StatusBar style="auto" />
            <WebView
                ref={webViewRef}
                source={{ uri: PRODUCTION_URL }}
                style={{ flex: 1 }}
                javaScriptEnabled
                domStorageEnabled
                originWhitelist={["*"]}
                allowsBackForwardNavigationGestures
                userAgent="MeuCondominioFacilApp"
                onMessage={handleMessage}
                // Injetar script para comunicação
                injectedJavaScript={`
                    window.ReactNativeWebView = true;
                    window.pushToken = '${expoPushToken}';
                    true;
                `}
            />
        </View>
    );
}

// Função para registrar push notifications
async function registerForPushNotificationsAsync(): Promise<string | undefined> {
    let token;

    // Verificar se é dispositivo físico
    if (!Device.isDevice) {
        console.log("Push notifications requerem dispositivo físico");
        return;
    }

    // Verificar/solicitar permissões
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== "granted") {
        console.log("Permissão para notificações não concedida");
        return;
    }

    // Obter token Expo Push
    try {
        const projectId = "condominio-facil-mobile"; // ID do projeto Expo
        token = (await Notifications.getExpoPushTokenAsync({
            projectId,
        })).data;
    } catch (e) {
        console.log("Erro ao obter push token:", e);
    }

    // Configurar canal de notificação para Android
    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
            name: "Notificações",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#10B981",
            sound: "default",
            enableVibrate: true,
            showBadge: true,
        });
    }

    return token;
}

// Função para enviar notificação local
async function sendLocalNotification(title: string, body: string, data?: any) {
    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            data: data || {},
            sound: "default",
        },
        trigger: null, // Imediato
    });
}
