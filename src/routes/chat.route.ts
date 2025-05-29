import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';

/**
 * Create and configure the chat routes
 * @param chatController The chat controller instance
 * @returns Configured Express router
 */
export function createChatRouter(chatController: ChatController): Router {
  const router = Router();

  // POST /chat - Process a chat message
  router.post('/', (req, res) => chatController.processMessage(req, res));

  return router;
}
