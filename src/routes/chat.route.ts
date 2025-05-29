import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';

/**
 * Create and configure the chat routes
 * @param chatController The chat controller instance
 * @returns Configured Express router
 */
export function createChatRouter(chatController: ChatController): Router {
  const router = Router();

  /**
   * @swagger
   * /chat:
   *   post:
   *     summary: Traiter un message utilisateur et obtenir une réponse
   *     description: Envoie un message utilisateur au chatbot et reçoit une réponse générée par Mistral AI
   *     tags: [Chat]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ChatRequest'
   *     responses:
   *       200:
   *         description: Réponse générée avec succès
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ChatResponse'
   *       400:
   *         description: Requête invalide
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Invalid request body
   *       500:
   *         description: Erreur interne du serveur
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Internal server error
   */
  router.post('/', (req, res) => chatController.processMessage(req, res));

  return router;
}
