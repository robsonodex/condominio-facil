# 🚀 Kit de Instalação: WhatsApp Server (Evolution API v2)

Este guia foi preparado para sua VPS Hostinger (KVM 2 - 8GB RAM).

## 1. Configuração do Domínio (Hostinger)
1. Acesse o painel da Hostinger > **DNS Zone Editor**.
2. Crie um registro **Tipo A**:
   - **Nome:** `whatsapp`
   - **Aponta para:** `SEU_IP_DA_VPS` (ex: 123.45.67.89)
   - **TTL:** 14400

---

## 2. Acessando o Servidor
Abra o Prompt de Comando (CMD) ou PowerShell no seu computador:
```bash
ssh root@SEU_IP_DA_VPS
# Digite 'yes' se pedir confirmação
# Digite a senha que você criou na Hostinger (ela não aparece enquanto digita)
```

---

## 3. Instalação Automática (Docker)

Copie e cole os comandos abaixo um por um:

### Passo A: Atualizar e Instalar Docker
```bash
apt update && apt upgrade -y
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install -y docker-compose
```

### Passo B: Criar Pasta e Arquivo
```bash
mkdir -p /opt/evolution
cd /opt/evolution
nano docker-compose.yml
```

### Passo C: O Arquivo de Configuração
Cole o conteúdo abaixo dentro do editor (clique com botão direito para colar):

```yaml
version: '3.3'

services:
  evolution_api:
    image: attdevelopers/evolution-api:v2.1.1
    restart: always
    ports:
      - "8080:8080"
    environment:
      - AUTHENTICATION_API_KEY=sua_senha_super_secreta_aqui
      # Troque 'sua_senha_super_secreta_aqui' por uma senha FORTE (Geral)
      
      - SERVER_URL=https://whatsapp.meucondominiofacil.com
      - DATABASE_ENABLED=true
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_URI=postgresql://evolution:evolutionpass@postgres:5432/evolution
      
      # Redis Config
      - CACHE_REDIS_ENABLED=true
      - CACHE_REDIS_URI=redis://redis:6379/1
      
    depends_on:
      - postgres
      - redis
    volumes:
      - evolution_instances:/evolution/instances
      - evolution_store:/evolution/store

  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      - POSTGRES_USER=evolution
      - POSTGRES_PASSWORD=evolutionpass
      - POSTGRES_DB=evolution
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:alpine
    restart: always
    command: ["redis-server", "--appendonly", "yes"]
    volumes:
      - redis_data:/data

volumes:
  evolution_instances:
  evolution_store:
  postgres_data:
  redis_data:
```
*Pressione `CTRL+O`, depois `ENTER` para salvar. E `CTRL+X` para sair.*

### Passo D: Subir o Servidor
```bash
docker-compose up -d
```

---

## 4. Testando
Acesse no seu navegador: `http://SEU_IP_DA_VPS:8080`
Você deve ver a mensagem: `{ "status": 200, "message": "Evolution API v2.1.1 is ready" }`

---

## 📝 Próximo Passo: HTTPS (Cadeado de Segurança)
Para colocar o cadeado (SSL) e usar o domínio `whatsapp.meucondominiofacil.com`, recomendo usar o **Nginx Proxy Manager**.

Se quiser, quando o servidor estiver rodando, me avise que configuramos o proxy reverso para ficar profissional!
