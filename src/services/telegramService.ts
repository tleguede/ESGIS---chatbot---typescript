import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { DatabaseAdapter } from '../db/dbAdapter';
import { MistralClient } from './mistralClient';

dotenv.config();

/**
 * Service for handling Telegram bot interactions
 */
export class TelegramService {
  private bot: TelegramBot;
  private dbAdapter: DatabaseAdapter;
  private mistralClient: MistralClient;
  private chatMode: Map<number, boolean> = new Map(); // Track which chats are in chat mode

  constructor(dbAdapter: DatabaseAdapter) {
    const token = process.env.TELEGRAM_BOT_TOKEN || '';
    
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is not set in environment variables');
    }

    this.bot = new TelegramBot(token, { polling: true });
    this.dbAdapter = dbAdapter;
    this.mistralClient = new MistralClient();
    
    this.setupCommands();
    this.setupEventHandlers();
  }

  /**
   * Set up the bot commands
   */
  private setupCommands(): void {
    this.bot.setMyCommands([
      { command: '/start', description: 'Start the conversation and show menu' },
      { command: '/chat', description: 'Start chatting with the AI' },
      { command: '/reset', description: 'Reset your conversation history' },
      { command: '/help', description: 'Show available commands' }
    ]);
  }

  /**
   * Set up event handlers for bot interactions
   */
  private setupEventHandlers(): void {
    // Handle /start command
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const _username = msg.from?.username || 'user';
      
      const welcomeMessage = 'Hello! I am your AI assistant powered by Mistral AI. How can I help you today?\n\n' +
        'Use /chat to start a conversation with me\n' +
        'Use /reset to clear our conversation history\n' +
        'Use /help to see all available commands';
      
      await this.bot.sendMessage(chatId, welcomeMessage);
    });

    // Handle /chat command
    this.bot.onText(/\/chat/, async (msg) => {
      const chatId = msg.chat.id;
      const _username = msg.from?.username || 'user';
      
      this.chatMode.set(chatId, true);
      
      await this.bot.sendMessage(chatId, 'Chat mode activated! You can now talk to me directly. What would you like to discuss?');
    });

    // Handle /reset command
    this.bot.onText(/\/reset/, async (msg) => {
      const chatId = msg.chat.id;
      
      await this.dbAdapter.resetConversation(chatId);
      
      await this.bot.sendMessage(chatId, 'Your conversation history has been reset.');
    });

    // Handle /help command
    this.bot.onText(/\/help/, async (msg) => {
      const chatId = msg.chat.id;
      
      const helpMessage = 'Available commands:\n\n' +
        '/start - Start the conversation and show menu\n' +
        '/chat - Start chatting with the AI\n' +
        '/reset - Reset your conversation history\n' +
        '/help - Show this help message';
      
      await this.bot.sendMessage(chatId, helpMessage);
    });

    // Handle regular messages (when in chat mode)
    this.bot.on('message', async (msg) => {
      // Skip command messages
      if (msg.text?.startsWith('/')) {
        return;
      }
      
      const chatId = msg.chat.id;
      const username = msg.from?.username || 'user';
      const message = msg.text || '';
      
      // Check if chat is in chat mode
      if (!this.chatMode.get(chatId)) {
        return;
      }
      
      // Save user message
      await this.dbAdapter.saveMessage(chatId, username, message);
      
      // Get conversation history
      const conversationHistory = await this.dbAdapter.getConversation(chatId);
      
      // Indicate the bot is typing
      await this.bot.sendChatAction(chatId, 'typing');
      
      // Get response from Mistral AI
      const response = await this.mistralClient.getCompletion(message, conversationHistory);
      
      // Save bot response
      await this.dbAdapter.saveResponse(chatId, response);
      
      // Send response to user
      await this.bot.sendMessage(chatId, response);
    });
  }

  /**
   * Process a message from the API
   * @param chatId Telegram chat ID
   * @param username Username
   * @param message Message content
   * @returns The bot's response
   */
  async processMessage(chatId: number, username: string, message: string): Promise<string> {
    // Save user message
    await this.dbAdapter.saveMessage(chatId, username, message);
    
    // Get conversation history
    const conversationHistory = await this.dbAdapter.getConversation(chatId);
    
    // Get response from Mistral AI
    const response = await this.mistralClient.getCompletion(message, conversationHistory);
    
    // Save bot response
    await this.dbAdapter.saveResponse(chatId, response);
    
    return response;
  }
}
