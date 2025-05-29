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
