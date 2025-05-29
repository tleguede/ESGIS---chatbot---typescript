import { createApp, getDatabaseAdapter } from './app';
import { config, validateEnv } from './config/env';

// Vérifier que les variables d'environnement requises sont définies
const missingVars = validateEnv();
if (missingVars.length > 0) {
  console.error(`Variables d'environnement manquantes : ${missingVars.join(', ')}`);
  console.error('Veuillez définir ces variables dans le fichier .env');
  process.exit(1);
}

// Obtenir le port depuis la configuration
const PORT = config.server.port;

// Get the appropriate database adapter
const dbAdapter = getDatabaseAdapter();

// Create the Express application
const app = createApp(dbAdapter);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API documentation available at http://localhost:${PORT}`);
  console.log('Telegram bot is active and listening for messages');
});
