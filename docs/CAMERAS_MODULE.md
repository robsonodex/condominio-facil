# Módulo de Câmeras - Condomínio Fácil v5.2

## Visão Geral

O módulo de câmeras permite **visualização ao vivo** de câmeras IP do condomínio via WebRTC ou HLS, além de **captura de snapshots** temporários (24 horas).

> ⚠️ **IMPORTANTE**: Este módulo NÃO grava vídeos. Apenas visualização em tempo real.

---

## Funcionalidades

### 1. Visualização ao Vivo
- Stream em tempo real via WebRTC ou HLS
- Tokens de acesso temporários (1 hora)
- Player integrado no navegador

### 2. Snapshots
- Captura de fotos instantâneas
- Expiração automática em 24 horas (TTL)
- Anexar a ocorrências ou visitantes

### 3. Validação de Rede
- Verificação automática de sub-rede
- Probe de status RTSP/ONVIF
- Alertas de conectividade

---

## Requisitos das Câmeras

### ✅ Requisitos Obrigatórios

| Requisito | Descrição |
|-----------|-----------|
| RTSP | Protocolo habilitado |
| ONVIF | Perfil S suportado |
| Codec | H.264 |
| IP | Fixo (estático) |
| Conexão | Cabeada (Ethernet) |
| Resolução | Mínimo 720p |
| Autenticação | Usuário/senha |
| Streaming | Constante (sem sleep) |

### ❌ Câmeras NÃO Compatíveis

- Tuya, IMOU, Positivo, iCSee
- Câmeras Wi-Fi domésticas
- Câmeras que funcionam apenas via app
- Câmeras sem RTSP
- Babás eletrônicas

---

## Requisito de Rede

### Mesma Rede Local Obrigatória

As câmeras DEVEM estar na mesma rede local (LAN/VLAN) do gateway configurado.

**Por quê?**
- Captura do stream RTSP sem portas externas
- Maior estabilidade e menor latência
- Segurança (sem exposição à internet)

**Exemplo:**
- Gateway: `192.168.1.10`
- Câmeras: `192.168.1.100`, `192.168.1.101`, etc.

---

## Arquitetura

```
[Câmeras IP] --RTSP--> [Gateway Local] --WebRTC/HLS--> [Navegador]
     |                      |
     |                      +--> [API Condomínio Fácil]
     |                                    |
     +-- Mesma Rede Local (LAN) ----------+
```

---

## Instalação do Gateway

### Requisitos do Servidor

- Docker instalado
- Acesso à mesma rede das câmeras
- Porta 8554 disponível

### Docker Compose

```yaml
version: '3.8'
services:
  camera-gateway:
    image: ghcr.io/condofacil/camera-gateway:latest
    network_mode: host
    environment:
      - PORT=8554
      - CONDO_ID=seu-condo-id
    restart: unless-stopped
```

### Comando Docker

```bash
docker run -d \
  --name camera-gateway \
  --network host \
  -e PORT=8554 \
  -e CONDO_ID=seu-condo-id \
  ghcr.io/condofacil/camera-gateway:latest
```

---

## APIs

### Endpoints Disponíveis

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/cameras?condo_id=` | Listar câmeras |
| POST | `/api/cameras` | Cadastrar câmera |
| POST | `/api/cameras/[id]/probe` | Testar conexão |
| GET | `/api/cameras/[id]/stream-token` | Obter token de stream |
| POST | `/api/cameras/[id]/snapshot` | Capturar snapshot |
| GET | `/api/cameras/gateways?condo_id=` | Listar gateways |
| POST | `/api/cameras/gateways` | Cadastrar gateway |

---

## LGPD e Privacidade

### Avisos Obrigatórios

O condomínio deve exibir avisos visíveis nas áreas monitoradas:

> "ESTE AMBIENTE É MONITORADO POR CÂMERAS DE SEGURANÇA"

### Política de Acesso

- Acesso restrito a porteiros e síndicos
- Registro de todos os acessos
- Snapshots expiram em 24 horas
- Câmeras apenas em áreas comuns

### Texto Legal

> "As imagens captadas têm finalidade exclusiva de segurança condominial, 
> sendo o acesso restrito a funcionários autorizados. Os dados são 
> tratados em conformidade com a Lei Geral de Proteção de Dados (LGPD)."

---

## Checklist de Instalação

- [ ] Gateway configurado no sistema
- [ ] Docker instalado no servidor local
- [ ] Container do gateway em execução
- [ ] Câmeras com IP fixo configurado
- [ ] RTSP habilitado nas câmeras
- [ ] ONVIF habilitado nas câmeras
- [ ] Todas as câmeras na mesma sub-rede
- [ ] Probe executado com sucesso
- [ ] Avisos LGPD afixados

---

## Troubleshooting

### Câmera não conecta

1. Verifique se o IP está correto
2. Execute o Probe para diagnóstico
3. Confirme que está na mesma rede do gateway
4. Verifique credenciais RTSP

### Stream não inicia

1. Verifique se a câmera está ativa (status verde)
2. Confirme que o gateway está online
3. Verifique se o token não expirou
4. Teste o RTSP diretamente: `vlc rtsp://ip:554/stream1`

### Snapshot não captura

1. A câmera precisa estar ativa
2. Verifique permissões do usuário
3. O gateway precisa estar acessível

---

## Suporte

Para dúvidas sobre configuração de câmeras específicas, entre em contato com o suporte técnico do fabricante da câmera para obter os parâmetros RTSP corretos.
