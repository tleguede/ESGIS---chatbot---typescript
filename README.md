# Telegram Chatbot with Mistral AI Integration

A Node.js backend API that serves as an interface between a Telegram bot and Mistral AI. This application allows users to interact with Mistral AI through a Telegram bot.

## Features

- Telegram bot integration with command support
- Mistral AI integration for natural language processing
- Conversation history tracking
- Multiple database adapter support (Memory, Prisma/SQL)
- RESTful API endpoints

## Telegram Bot Commands

| Command | Description |
| ------- | ----------- |
| `/start` | Start the conversation and display the menu |
| `/chat` | Start chatting with the AI |
| `/reset` | Reset the conversation history |
| `/help` | Display available commands |

## API Endpoints

### `GET /`

Returns basic information about the API.

### `POST /chat`

Process a chat message and get a response from Mistral AI.

**Request Body:**

```json
{
  "chat_id": 123456,
  "username": "johndoe",
  "message": "Hello bot!"
}
```

**Response:**

```json
{
  "status": "success",
  "reply": "Hello! How can I help you today?"
}
```

## Setup and Installation

### Prérequis

- Node.js 18 ou supérieur
- npm ou yarn
- AWS CLI configuré avec les identifiants appropriés
- AWS SAM CLI installé

### Installation locale

1. Cloner le dépôt
2. Installer les dépendances :
   ```bash
   npm install
   ```
3. Créer un fichier `.env` à la racine du projet avec les variables suivantes :
   ```
   TELEGRAM_BOT_TOKEN=votre_token_telegram
   MISTRAL_API_KEY=votre_clé_api_mistral
   DATABASE_URL=votre_url_postgresql
   USE_MEMORY_ADAPTER=false
   NODE_ENV=development
   ```
4. Initialiser la base de données (si vous utilisez Prisma) :
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```
5. Lancer l'application en mode développement :
   ```bash
   npm run dev
   ```

## Configuration AWS

Ce projet est configuré pour être déployé sur AWS Lambda avec API Gateway et DynamoDB. La configuration est définie dans le fichier `infrastructure/template.yaml`.

### Structure AWS

- **Lambda Function** : Exécute le code du chatbot
- **API Gateway** : Expose les endpoints HTTP pour interagir avec le chatbot
- **DynamoDB** : Stocke les conversations et les messages
- **Secrets Manager** : Stocke les secrets comme les tokens et clés API

### Variables d'environnement AWS

Les variables d'environnement suivantes sont utilisées dans l'environnement AWS :

- `NODE_ENV` : Environnement d'exécution (dev, preprod, prod)
- `TELEGRAM_BOT_TOKEN` : Token du bot Telegram
- `MISTRAL_API_KEY` : Clé API pour Mistral AI
- `DYNAMODB_TABLE` : Nom de la table DynamoDB
- `AWS_REGION_NAME` : Région AWS
- `ENV_NAME` : Nom de l'environnement

## Déploiement

### Déploiement local avec SAM

Pour tester l'application localement avec AWS SAM :

```bash
npm run build
sam local start-api
```

### Déploiement sur AWS

1. Construire l'application :
   ```bash
   npm run build
   sam build --use-container -t infrastructure/template.yaml
   ```

2. Déployer l'application :
   ```bash
   sam deploy --guided
   ```
   Ou avec le Makefile :
   ```bash
   make deploy env=dev
   ```

### Déploiement avec Jenkins

Le projet inclut un `Jenkinsfile` qui définit le pipeline CI/CD. Le pipeline effectue les étapes suivantes :

1. Installation des dépendances
2. Injection des variables d'environnement
3. Linting du code
4. Exécution des tests
5. Construction de l'application
6. Déploiement sur AWS
7. Test de l'endpoint déployé

Pour utiliser Jenkins, configurez les credentials suivants dans Jenkins :

- `tleguede-chatbot-env-file` : Fichier contenant les variables d'environnement

### Prerequisites

- Node.js (v14+)
- npm or yarn
- PostgreSQL (optional, for Prisma adapter)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Copy the `.env.example` file to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:
- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token (get it from BotFather)
- `MISTRAL_API_KEY`: Your Mistral AI API key

4. Build the project:

```bash
npm run build
```

5. Start the server:

```bash
npm start
```

For development with hot-reloading:

```bash
npm run dev
```

## Database Configuration

The application supports multiple database adapters:

### Memory Adapter (Default)

For development and testing. Data is stored in memory and will be lost when the server restarts.

Set in `.env`:
```
USE_MEMORY_ADAPTER=true
```

### Prisma Adapter (SQL)

For production use with PostgreSQL.

1. Set your database URL in `.env`:
```
DATABASE_URL="postgresql://username:password@localhost:5432/telegram_bot_db"
```

2. Run Prisma migrations:
```bash
npx prisma migrate dev
```

## License

MIT
