import swaggerJSDoc from 'swagger-jsdoc';
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { config } from './env';

// Options de base pour Swagger
const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Chatbot Telegram avec Mistral AI',
      version: '1.0.0',
      description: 'API pour interfacer Telegram et Mistral AI',
      contact: {
        name: 'Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: config.server.nodeEnv === 'production' 
          ? 'https://api.example.com' 
          : `http://localhost:${config.server.port}`,
        description: config.server.nodeEnv === 'production' ? 'Serveur de production' : 'Serveur de développement'
      }
    ],
    tags: [
      {
        name: 'Chat',
        description: 'Endpoints pour interagir avec le chatbot'
      }
    ],
    components: {
      schemas: {
        ChatRequest: {
          type: 'object',
          required: ['chat_id', 'username', 'message'],
          properties: {
            chat_id: {
              type: 'integer',
              description: 'ID du chat Telegram'
            },
            username: {
              type: 'string',
              description: 'Nom d\'utilisateur Telegram'
            },
            message: {
              type: 'string',
              description: 'Message de l\'utilisateur'
            }
          }
        },
        ChatResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success'
            },
            reply: {
              type: 'string',
              example: 'Bonjour ! Comment puis-je vous aider aujourd\'hui ?'
            }
          }
        },
        ApiInfo: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              example: 'Telegram Chatbot API'
            },
            version: {
              type: 'string',
              example: '1.0.0'
            },
            description: {
              type: 'string',
              example: 'API pour interfacer Telegram et Mistral AI'
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};

// Générer la spécification Swagger
const swaggerSpec = swaggerJSDoc(swaggerOptions);

/**
 * Configurer Swagger UI pour l'application Express
 * @param app Application Express
 */
export function setupSwagger(app: Express): void {
  // Route pour la documentation Swagger
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  
  // Rediriger la route racine vers la documentation Swagger
  app.get('/', (req, res) => {
    res.redirect('/docs');
  });
  
  // Endpoint pour obtenir la spécification Swagger en JSON
  app.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  
  console.log('Documentation Swagger configurée aux routes /docs et /swagger.json');
}
