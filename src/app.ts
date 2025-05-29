import express, { Express, Request, Response } from 'express';
import { createChatRouter } from './routes/chat.route';
import { ChatController } from './controllers/chat.controller';
import { TelegramService } from './services/telegramService';
import { DatabaseAdapter } from './db/dbAdapter';
import { MemoryAdapter } from './db/adapters/memoryAdapter';
import { PrismaAdapter } from './db/adapters/prismaAdapter';
import { DynamoAdapter } from './db/adapters/dynamoAdapter';
import { config } from './config/env';

/**
 * Create and configure the Express application
 * @param dbAdapter The database adapter to use
 * @returns Configured Express application
 */
export function createApp(dbAdapter: DatabaseAdapter): Express {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Create services and controllers
  const telegramService = new TelegramService(dbAdapter);
  const chatController = new ChatController(telegramService);

  // Routes
  app.get('/', (req: Request, res: Response) => {
    res.json({
      name: 'Telegram Chatbot API',
      version: '1.0.0',
      description: 'API for interfacing between Telegram and Mistral AI'
    });
  });

  app.use('/chat', createChatRouter(chatController));

  return app;
}

/**
 * Get the appropriate database adapter based on environment variables
 * @returns The configured database adapter
 */
export function getDatabaseAdapter(): DatabaseAdapter {
  // Check if we should use the memory adapter
  if (config.database.useMemoryAdapter) {
    console.log('Using memory adapter for database storage');
    return new MemoryAdapter();
  }

  // Check if we should use DynamoDB (environnement AWS Lambda)
  if (config.database.aws.isLambdaEnvironment) {
    console.log('Using DynamoDB adapter for database storage');
    return new DynamoAdapter();
  }

  // Default to Prisma adapter
  console.log('Using Prisma adapter for database storage');
  return new PrismaAdapter();
}
