# 04 - Módulo de Portaria e Segurança

O módulo de Portaria foi evoluído na versão 10.0 para incluir tecnologias de visão computacional e automação de acesso.

## 🚪 Controle de Acesso
Registro digital de toda movimentação no condomínio.

- **Visitantes e Prestadores**: Cadastro rápido com foto e registro de documento.
- **Convites por Morador**: Moradores geram pré-autorizações via app para seus convidados.
- **Registro de Veículos**: Controle de entrada por unidade e vaga.

## 🤖 Portaria 4.0 (V10.0)

### Reconhecimento Facial
- Integração com **AWS Rekognition**.
- Cadastro de "Face Tokens" para moradores e visitantes frequentes.
- API preparada para liberação automática de portões via reconhecimento.

### Leitura de Placas (OCR)
- Identificação automática de veículos autorizados através da placa.
- Registro de logs com data, hora e imagem da placa capturada.

## 📞 Interfonia Digital
- **Chamadas via App**: Visitantes podem "tocar" o interfone na portaria e o morador atende diretamente no celular.
- **Logs de Chamadas**: Histórico de quem chamou, quem atendeu e duração da conversa.

## 📦 Mensageria
- **Recebimento de Encomendas**: Porteiro registra a chegada da caixa e o sistema notifica o morador instantaneamente (Push/E-mail).
- **Assinatura Digital**: Retirada confirmada com assinatura na tela do dispositivo.
