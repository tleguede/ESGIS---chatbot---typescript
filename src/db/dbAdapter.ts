/**
 * Database adapter interface for the Telegram chatbot
 * All database implementations must implement this interface
 */
export interface DatabaseAdapter {
  /**
   * Save a user message to the database
   * @param chatId Telegram chat ID
   * @param username Telegram username
   * @param message Message content
   */
  saveMessage(chatId: number, username: string, message: string): Promise<void>;
  
  /**
   * Save a bot response to the database
   * @param chatId Telegram chat ID
   * @param response Response content
   */
  saveResponse(chatId: number, response: string): Promise<void>;
  
  /**
   * Get the conversation history for a specific chat
   * @param chatId Telegram chat ID
   * @returns Array of messages with sender and content
   */
  getConversation(chatId: number): Promise<Array<{ from: string, content: string }>>;
  
  /**
   * Reset/clear the conversation history for a specific chat
   * @param chatId Telegram chat ID
   */
  resetConversation(chatId: number): Promise<void>;
}
