import express, { Express, Request, Response } from 'express';
import { createChatRouter } from './routes/chat.route';
import { ChatController } from './controllers/chat.controller';
import { TelegramService } from './services/telegramService';
import { DatabaseAdapter } from './db/dbAdapter';
import { MemoryAdapter } from './db/adapters/memoryAdapter';
import { PrismaAdapter } from './db/adapters/prismaAdapter';
import { DynamoAdapter } from './db/adapters/dynamoAdapter';
import { config } from './config/env';
import { setupSwagger } from './config/swagger';

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
  
  // Configurer Swagger
  setupSwagger(app);

  // Create services and controllers
  const telegramService = new TelegramService(dbAdapter);
  const chatController = new ChatController(telegramService);

  // Routes
  // La route racine est maintenant gérée par Swagger

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
