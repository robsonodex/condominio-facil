# 08 - Interface Mobile e PWA

O **Meu Condomínio Fácil** foi desenvolvido com foco total na portabilidade, permitindo que moradores e funcionários usem o sistema em qualquer lugar.

## 📱 PWA (Progressive Web App)
O sistema funciona como um aplicativo instalado sem a necessidade de baixar em lojas (App Store/Play Store).

- **Mobile First**: Todas as telas do morador e portaria são 100% responsivas.
- **Instalação**: O usuário pode "Adicionar à tela de início" através do navegador (Chrome ou Safari), criando um ícone no celular.
- **Vantagem**: Deploy instantâneo. Atualizações feitas na web refletem na hora para todos os usuários do PWA.

## 🔔 Notificações Push
- O sistema utiliza a API de Push nativa do navegador para enviar alertas de:
    - Boletos vencendo.
    - Chegada de encomendas na portaria.
    - Novas ocorrências ou mensagens no chat.

## 📸 Uso de Recursos Nativos
Através do navegador, o sistema acessa:
- **Câmera**: Para tirar fotos de visitantes e escanear documentos/placas.
- **Gelocalização**: Para marcação de ponto (quando habilitado) ou registro de ocorrências.

## 🧪 Suporte Mobile (V10.0)
- **Modo Tablet**: Ideal para uso fixo na portaria para registro e assinaturas digitais.
- **Modo Smartphone**: Ideal para o morador realizar reservas, checar finanças e receber avisos.
