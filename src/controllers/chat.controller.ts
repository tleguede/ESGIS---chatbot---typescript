import { Request, Response } from 'express';
import { TelegramService } from '../services/telegramService';
import { z } from 'zod';
import { config } from '../config/env';

/**
 * Controller for handling chat-related endpoints
 */
export class ChatController {
  private telegramService: TelegramService;

  constructor(telegramService: TelegramService) {
    this.telegramService = telegramService;
  }

  /**
   * Process a chat message from the API
   * @param req Express request
   * @param res Express response
   */
  async processMessage(req: Request, res: Response): Promise<void> {
    try {
      // Define the expected request body schema
      const chatSchema = z.object({
        chat_id: z.number(),
        username: z.string(),
        message: z.string()
      });

      // Validate the request body
      const result = chatSchema.safeParse(req.body);
      
      if (!result.success) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid request body',
          errors: result.error.errors
        });
        return;
      }

      const { chat_id, username, message } = result.data;

      // Afficher le message en mode développement
      if (config.server.nodeEnv === 'development') {
        console.log('\n===== MESSAGE REÇU =====');
        console.log(`De: ${username} (Chat ID: ${chat_id})`);
        console.log(`Message: "${message}"`);
        console.log('========================\n');
      }

      // Process the message
      const reply = await this.telegramService.processMessage(chat_id, username, message);

      // Afficher la réponse en mode développement
      if (config.server.nodeEnv === 'development') {
        console.log('\n===== RÉPONSE ENVOYÉE =====');
        console.log(`À: ${username} (Chat ID: ${chat_id})`);
        console.log(`Réponse: "${reply}"`);
        console.log('========================\n');
      }

      // Return the response
      res.status(200).json({
        status: 'success',
        reply
      });
    } catch (error) {
      console.error('Error processing message:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }
}
