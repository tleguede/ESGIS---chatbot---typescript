import { createApp, getDatabaseAdapter } from './app';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get the port from environment variables or use default
const PORT = process.env.PORT || 3000;

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
