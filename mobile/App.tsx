import { View, Platform } from "react-native";
import { WebView } from "react-native-webview";
import { StatusBar } from "expo-status-bar";

// URL de produção (para mobile)
const PRODUCTION_URL = "https://www.meucondominiofacil.com";
// URL local para desenvolvimento (para web - evita bloqueio de iframe)
const DEV_URL = "http://localhost:3000";

// Em mobile, sempre usa produção. Em web, usa localhost para evitar bloqueio de iframe
const getSiteUrl = () => {
    if (Platform.OS === "web") {
        return DEV_URL;
    }
    return PRODUCTION_URL;
};

export default function App() {
    const siteUrl = getSiteUrl();

    // Na web, usamos iframe pois WebView não é suportado
    if (Platform.OS === "web") {
        return (
            <View style={{ flex: 1 }}>
                <StatusBar style="auto" />
                <iframe
                    src={siteUrl}
                    style={{
                        flex: 1,
                        width: "100%",
                        height: "100%",
                        border: "none",
                    }}
                    title="Condomínio Fácil"
                />
            </View>
        );
    }

    // Em dispositivos nativos (iOS/Android), usamos WebView
    return (
        <View style={{ flex: 1 }}>
           <WebView
    source={{ uri: siteUrl }}
    style={{ flex: 1 }}
    userAgent="MeuCondominioApp Android"
    javaScriptEnabled
    domStorageEnabled
/>

        </View>
    );
}
