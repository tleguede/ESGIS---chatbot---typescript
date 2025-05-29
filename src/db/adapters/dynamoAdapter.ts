import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  QueryCommand, 
  UpdateCommand,
  ScanCommand
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseAdapter } from '../dbAdapter';
import { config } from '../../config/env';

/**
 * Implémentation DynamoDB de l'interface DatabaseAdapter
 * Pour le stockage dans AWS DynamoDB
 * 
 * Structure des données dans DynamoDB:
 * - PK: USER#{chatId} - Clé de partition pour regrouper les messages par utilisateur
 * - SK: MSG#{timestamp} - Clé de tri pour ordonner les messages chronologiquement
 * - conversation_id: UUID pour regrouper les messages d'une même conversation
 * - from: 'user' ou 'bot' pour identifier l'expéditeur
 * - content: Contenu du message
 * - timestamp: Horodatage ISO
 * - status: 'active' ou 'closed' pour l'état de la conversation
 */
export class DynamoAdapter implements DatabaseAdapter {
  private client: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    // Initialiser le client DynamoDB
    const dynamoClient = new DynamoDBClient({
      region: config.database.aws.region,
      credentials: {
        accessKeyId: config.database.aws.accessKeyId,
        secretAccessKey: config.database.aws.secretAccessKey
      }
    });

    this.client = DynamoDBDocumentClient.from(dynamoClient);
    this.tableName = config.database.aws.dynamoTable;
  }
  
  /**
   * Démarre une nouvelle conversation et retourne son ID
   * @param chatId ID de chat Telegram
   * @returns ID de la nouvelle conversation
   */
  async startConversation(chatId: number): Promise<string> {
    const conversationId = uuidv4();
    const timestamp = new Date().toISOString();
    
    // Créer un marqueur de conversation pour faciliter les requêtes futures
    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          PK: `USER#${chatId}`,
          SK: `CONV#${conversationId}#INFO`,
          conversation_id: conversationId,
          status: 'active',
          timestamp,
          type: 'conversation_marker'
        }
      })
    );
    
    return conversationId;
  }
  
  /**
   * Récupère l'ID de la dernière conversation active pour un utilisateur
   * @param chatId ID de chat Telegram
   * @returns ID de la dernière conversation active ou null
   */
  async getLastActiveConversation(chatId: number): Promise<string | null> {
    try {
      // D'abord, récupérons les marqueurs de conversation (plus efficace)
      const response = await this.client.send(
        new QueryCommand({
          TableName: this.tableName,
          KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
          ExpressionAttributeValues: {
            ':pk': `USER#${chatId}`,
            ':prefix': 'CONV#'
          },
          ScanIndexForward: false, // Du plus récent au plus ancien
          Limit: 10 // Nous n'avons besoin que des conversations les plus récentes
        })
      );
      
      const items = response.Items || [];
      
      // Filtrer pour trouver la conversation la plus récente qui n'est pas fermée
      for (const item of items) {
        if (item.status !== 'closed') {
          return item.conversation_id as string;
        }
      }
      
      // Si nous n'avons pas trouvé de conversation active, vérifions les messages récents
      const messagesResponse = await this.client.send(
        new QueryCommand({
          TableName: this.tableName,
          KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
          ExpressionAttributeValues: {
            ':pk': `USER#${chatId}`,
            ':prefix': 'CONV#'
          },
          ScanIndexForward: false, // Du plus récent au plus ancien
          Limit: 1 // Nous n'avons besoin que du message le plus récent
        })
      );
      
      if (messagesResponse.Items && messagesResponse.Items.length > 0) {
        return messagesResponse.Items[0].conversation_id as string;
      }
      
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération de la dernière conversation active:', error);
      return null;
    }
  }
  
  /**
   * Clôture une conversation (marque tous ses messages comme fermés)
   * @param chatId ID de chat Telegram
   * @param conversationId ID de la conversation à clôturer
   */
  async closeConversation(chatId: number, conversationId: string): Promise<void> {
    try {
      // Au lieu de mettre à jour chaque message individuellement,
      // nous pourrions ajouter un nouvel élément qui indique que la conversation est fermée
      // Cela évite de faire plusieurs mises à jour et permet de savoir rapidement si une conversation est fermée
      const timestamp = new Date().toISOString();
      
      await this.client.send(
        new PutCommand({
          TableName: this.tableName,
          Item: {
            PK: `USER#${chatId}`,
            SK: `CONV#${conversationId}#STATUS`,
            conversation_id: conversationId,
            status: 'closed',
            timestamp
          }
        })
      );
    } catch (error) {
      console.error('Erreur lors de la clôture de la conversation:', error);
      throw error;
    }
  }
  
  /**
   * Récupère l'historique d'une conversation spécifique
   * @param chatId ID de chat Telegram
   * @param conversationId ID de la conversation
   * @param limit Nombre maximum de messages à récupérer
   * @returns Tableau de messages de la conversation
   */
  async getConversationHistoryById(chatId: number, conversationId: string, limit: number = 50): Promise<any[]> {
    try {
      // Utiliser directement la table principale avec la structure de clé optimisée
      const response = await this.client.send(
        new QueryCommand({
          TableName: this.tableName,
          KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
          ExpressionAttributeValues: {
            ':pk': `USER#${chatId}`,
            ':skPrefix': `CONV#${conversationId}#MSG#`
          },
          Limit: limit,
          ScanIndexForward: true // Ordre chronologique
        })
      );
      
      return response.Items || [];
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique de conversation:', error);
      return [];
    }
  }

  /**
   * Sauvegarder un message utilisateur dans la base de données
   * @param chatId ID de chat Telegram
   * @param username Nom d'utilisateur Telegram
   * @param message Contenu du message
   */
  async saveMessage(chatId: number, username: string, message: string): Promise<void> {
    // Vérifier s'il existe une conversation active
    let conversationId = await this.getLastActiveConversation(chatId);
    
    // Si aucune conversation active n'existe, en créer une nouvelle
    if (!conversationId) {
      conversationId = await this.startConversation(chatId);
    }
    
    const timestamp = new Date().toISOString();

    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          PK: `USER#${chatId}`,
          SK: `CONV#${conversationId}#MSG#${timestamp}`,
          conversation_id: conversationId,
          username,
          from: 'user',
          content: message,
          timestamp,
          status: 'active'
        }
      })
    );
  }

  /**
   * Sauvegarder une réponse du bot dans la base de données
   * @param chatId ID de chat Telegram
   * @param response Contenu de la réponse
   */
  async saveResponse(chatId: number, response: string): Promise<void> {
    // Récupérer la dernière conversation active
    const conversationId = await this.getLastActiveConversation(chatId);
    
    if (!conversationId) {
      console.error('Aucune conversation active trouvée pour sauvegarder la réponse');
      return;
    }
    
    const timestamp = new Date().toISOString();

    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          PK: `USER#${chatId}`,
          SK: `CONV#${conversationId}#MSG#${timestamp}`,
          conversation_id: conversationId,
          username: 'bot',
          from: 'bot',
          content: response,
          timestamp,
          status: 'active'
        }
      })
    );
  }

  /**
   * Récupérer l'historique de conversation depuis la base de données
   * @param chatId ID de chat Telegram
   * @param limit Nombre maximum de messages à récupérer
   * @returns Tableau de messages avec expéditeur et contenu
   */
  async getConversation(chatId: number, limit: number = 20): Promise<Array<{ from: string, content: string }>> {
    try {
      // Récupérer la dernière conversation active
      const conversationId = await this.getLastActiveConversation(chatId);
      
      if (!conversationId) {
        return [];
      }
      
      // Récupérer les messages de cette conversation
      const items = await this.getConversationHistoryById(chatId, conversationId, limit);
      
      return items.map(item => ({
        from: item.from as string,
        content: item.content as string
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération de la conversation:', error);
      return [];
    }
  }

  /**
   * Réinitialiser/effacer l'historique de conversation dans la base de données
   * @param chatId ID de chat Telegram
   */
  async resetConversation(chatId: number): Promise<void> {
    try {
      // Récupérer la dernière conversation active
      const conversationId = await this.getLastActiveConversation(chatId);
      
      if (!conversationId) {
        return;
      }
      
      // Clôturer la conversation actuelle
      await this.closeConversation(chatId, conversationId);
      
      // Créer une nouvelle conversation (optionnel)
      await this.startConversation(chatId);
    } catch (error) {
      console.error('Erreur lors de la réinitialisation de la conversation:', error);
      throw error;
    }
  }
}
