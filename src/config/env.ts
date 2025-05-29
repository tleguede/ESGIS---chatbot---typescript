import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

/**
 * Configuration centralisée pour les variables d'environnement
 * Toutes les variables d'environnement doivent être accessibles via cet objet
 */
export const config = {
  // Configuration du serveur
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  
  // Configuration de Telegram
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  },
  
  // Configuration de Mistral AI
  mistral: {
    apiKey: process.env.MISTRAL_API_KEY || '',
    baseUrl: 'https://api.mistral.ai/v1',
    model: 'mistral-medium',
  },
  
  // Configuration de la base de données
  database: {
    // Prisma (SQL)
    databaseUrl: process.env.DATABASE_URL || '',
    
    // Adaptateur à utiliser
    useMemoryAdapter: process.env.USE_MEMORY_ADAPTER === 'true',
    
    // MongoDB (optionnel)
    mongodbUri: process.env.MONGODB_URI || '',
    
    // DynamoDB (optionnel)
    aws: {
      region: process.env.AWS_REGION_NAME || 'eu-west-3',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      dynamoTable: process.env.DYNAMO_TABLE || '',
      profile: process.env.AWS_PROFILE || 'esgis_profile',
      envName: process.env.ENV_NAME || 'tleguede-dev',
      isLambdaEnvironment: Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME),
    },
  },
};

/**
 * Vérifie que les variables d'environnement requises sont définies
 * @returns Un tableau des variables manquantes
 */
export const validateEnv = (): string[] => {
  const missingVars: string[] = [];
  
  // Vérifier les variables requises
  if (!config.telegram.botToken) {
    missingVars.push('TELEGRAM_BOT_TOKEN');
  }
  
  if (!config.mistral.apiKey) {
    missingVars.push('MISTRAL_API_KEY');
  }
  
  // Si l'adaptateur mémoire n'est pas utilisé, vérifier la connexion à la base de données
  if (!config.database.useMemoryAdapter && !config.database.databaseUrl) {
    missingVars.push('DATABASE_URL');
  }
  
  return missingVars;
};
