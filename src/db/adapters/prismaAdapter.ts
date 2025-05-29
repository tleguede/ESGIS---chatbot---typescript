import { PrismaClient } from '@prisma/client';
import { DatabaseAdapter } from '../dbAdapter';

/**
 * Prisma implementation of the DatabaseAdapter interface
 * For SQL database storage
 */
export class PrismaAdapter implements DatabaseAdapter {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Save a user message to the database
   * @param chatId Telegram chat ID
   * @param username Telegram username
   * @param message Message content
   */
  async saveMessage(chatId: number, username: string, message: string): Promise<void> {
    await this.prisma.message.create({
      data: {
        chatId,
        username,
        from: 'user',
        content: message
      }
    });
  }

  /**
   * Save a bot response to the database
   * @param chatId Telegram chat ID
   * @param response Response content
   */
  async saveResponse(chatId: number, response: string): Promise<void> {
    await this.prisma.message.create({
      data: {
        chatId,
        username: 'bot',
        from: 'bot',
        content: response
      }
    });
  }

  /**
   * Get the conversation history from the database
   * @param chatId Telegram chat ID
   * @returns Array of messages with sender and content
   */
  async getConversation(chatId: number): Promise<Array<{ from: string, content: string }>> {
    const messages = await this.prisma.message.findMany({
      where: {
        chatId
      },
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        from: true,
        content: true
      }
    });

    return messages;
  }

  /**
   * Reset/clear the conversation history in the database
   * @param chatId Telegram chat ID
   */
  async resetConversation(chatId: number): Promise<void> {
    await this.prisma.message.deleteMany({
      where: {
        chatId
      }
    });
  }
}
