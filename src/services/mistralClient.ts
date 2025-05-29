import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Client for interacting with the Mistral AI API
 */
export class MistralClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.mistral.ai/v1';
  private model: string = 'mistral-medium';

  constructor() {
    this.apiKey = process.env.MISTRAL_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('MISTRAL_API_KEY is not set in environment variables');
    }
  }

  /**
   * Send a message to Mistral AI and get a response
   * @param prompt The user's message
   * @param conversationHistory Previous conversation history for context
   * @returns The AI's response
   */
  async getCompletion(prompt: string, conversationHistory: Array<{ from: string, content: string }> = []): Promise<string> {
    try {
      // Format the conversation history for the Mistral API
      const messages = this.formatConversationHistory(conversationHistory);
      
      // Add the current user message
      messages.push({
        role: 'user',
        content: prompt
      });

      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages,
          temperature: 0.7,
          max_tokens: 1000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error calling Mistral API:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('API response:', error.response.data);
      }
      return 'Sorry, I encountered an error while processing your request.';
    }
  }

  /**
   * Format conversation history for the Mistral API
   * @param conversationHistory Array of messages with sender and content
   * @returns Formatted messages for the Mistral API
   */
  private formatConversationHistory(conversationHistory: Array<{ from: string, content: string }>): Array<{ role: string, content: string }> {
    return conversationHistory.map(message => ({
      role: message.from === 'user' ? 'user' : 'assistant',
      content: message.content
    }));
  }
}
