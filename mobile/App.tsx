import { View, Platform } from "react-native";
import { WebView } from "react-native-webview";
import { StatusBar } from "expo-status-bar";

// URL de produção - versão mobile exclusiva (/app)
const PRODUCTION_URL = "https://www.meucondominiofacil.com/app";
// URL local para desenvolvimento
const DEV_URL = "http://localhost:3000/app";

// Em mobile, sempre usa produção. Em web, usa localhost
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
