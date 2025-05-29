import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { createApp, getDatabaseAdapter } from './app';
import { config, validateEnv } from './config/env';

// Valider les variables d'environnement au démarrage
const missingVars = validateEnv();
if (missingVars.length > 0) {
  console.error(`Variables d'environnement manquantes : ${missingVars.join(', ')}`);
  console.error('Veuillez définir ces variables dans les variables d\'environnement Lambda');
  process.exit(1);
}

// Obtenir l'adaptateur de base de données approprié
const dbAdapter = getDatabaseAdapter();

// Créer l'application Express
const app = createApp(dbAdapter);

/**
 * Handler pour AWS Lambda
 * @param event Événement API Gateway
 * @param context Contexte Lambda
 * @returns Réponse API Gateway
 */
export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  try {
    // Log de l'événement en mode développement
    if (config.server.nodeEnv === 'development') {
      console.log('Événement Lambda reçu:', JSON.stringify(event, null, 2));
    }

    // Extraire les informations de la requête
    const path = event.path || '/';
    const method = event.httpMethod || 'GET';
    const body = event.body ? JSON.parse(event.body) : {};
    const headers = event.headers || {};

    // Traiter la requête en fonction du chemin
    if (path === '/chat' && method === 'POST') {
      // Vérifier que les paramètres requis sont présents
      if (!body.chat_id || !body.username || !body.message) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            status: 'error',
            message: 'Paramètres manquants: chat_id, username et message sont requis'
          })
        };
      }

      // Traiter le message via le service Telegram
      const telegramService = app.get('telegramService');
      const reply = await telegramService.processMessage(body.chat_id, body.username, body.message);

      // Retourner la réponse
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          status: 'success',
          reply
        })
      };
    } else if (path === '/' && method === 'GET') {
      // Route racine pour les informations de l'API
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          name: 'Telegram Chatbot API',
          version: '1.0.0',
          description: 'API pour interfacer Telegram et Mistral AI'
        })
      };
    } else {
      // Route non trouvée
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          status: 'error',
          message: 'Route non trouvée'
        })
      };
    }
  } catch (error) {
    console.error('Erreur dans le handler Lambda:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        status: 'error',
        message: 'Erreur interne du serveur'
      })
    };
  }
};
