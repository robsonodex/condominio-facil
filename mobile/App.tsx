import { View } from "react-native";
import { WebView } from "react-native-webview";
import { StatusBar } from "expo-status-bar";

const PRODUCTION_URL = "https://www.meucondominiofacil.com/app";

export default function App() {
    return (
        <View style={{ flex: 1 }}>
            <StatusBar style="auto" />
            <WebView
                source={{ uri: PRODUCTION_URL }}
                style={{ flex: 1 }}
                javaScriptEnabled
                domStorageEnabled
                originWhitelist={["*"]}
                allowsBackForwardNavigationGestures
                userAgent="MeuCondominioFacilApp"
            />
        </View>
    );
}
