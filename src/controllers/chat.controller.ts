import { Request, Response } from 'express';
import { TelegramService } from '../services/telegramService';
import { z } from 'zod';

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

      // Process the message
      const reply = await this.telegramService.processMessage(chat_id, username, message);

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
