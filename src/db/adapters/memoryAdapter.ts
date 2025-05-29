import { DatabaseAdapter } from '../dbAdapter';

/**
 * In-memory implementation of the DatabaseAdapter interface
 * Useful for development and testing
 */
export class MemoryAdapter implements DatabaseAdapter {
  private conversations: Map<number, Array<{ from: string, content: string }>> = new Map();

  /**
   * Save a user message to memory
   * @param chatId Telegram chat ID
   * @param username Telegram username
   * @param message Message content
   */
  async saveMessage(chatId: number, username: string, message: string): Promise<void> {
    const conversation = this.getOrCreateConversation(chatId);
    conversation.push({ from: 'user', content: message });
  }

  /**
   * Save a bot response to memory
   * @param chatId Telegram chat ID
   * @param response Response content
   */
  async saveResponse(chatId: number, response: string): Promise<void> {
    const conversation = this.getOrCreateConversation(chatId);
    conversation.push({ from: 'bot', content: response });
  }

  /**
   * Get the conversation history from memory
   * @param chatId Telegram chat ID
   * @returns Array of messages with sender and content
   */
  async getConversation(chatId: number): Promise<Array<{ from: string, content: string }>> {
    return this.getOrCreateConversation(chatId);
  }

  /**
   * Reset/clear the conversation history in memory
   * @param chatId Telegram chat ID
   */
  async resetConversation(chatId: number): Promise<void> {
    this.conversations.set(chatId, []);
  }

  /**
   * Helper method to get or create a conversation
   * @param chatId Telegram chat ID
   * @returns The conversation array
   */
  private getOrCreateConversation(chatId: number): Array<{ from: string, content: string }> {
    if (!this.conversations.has(chatId)) {
      this.conversations.set(chatId, []);
    }
    return this.conversations.get(chatId)!;
  }
}
