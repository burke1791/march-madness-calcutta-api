import AWS from 'aws-sdk';
import { DYNAMODB_INDEXES, DYNAMODB_TABLES } from '../utilities/constants';

const dynamodb = new AWS.DynamoDB();

const CONNECTION_TABLE = DYNAMODB_TABLES.CONNECTION_TABLE;
const CONNECTION_INDEX = DYNAMODB_INDEXES.CONNECTION_INDEX;
const CHAT_TABLE = DYNAMODB_TABLES.CHAT_TABLE;

export async function getAllMessages(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const cognitoSub = event.cognitoPoolClaims.sub;
  const leagueId = event.path.leagueId;

  try {
    const connectionParams = {
      TableName: CONNECTION_TABLE,
      IndexName: CONNECTION_INDEX,
      ExpressionAttributeValues: {
        ':v1': {
          N: leagueId
        },
        ':v2': {
          S: cognitoSub
        }
      },
      KeyConditionExpression: 'LeagueId = :v1 AND CognitoSub = :v2',
      ProjectionExpression: 'Alias'
    };

    const connectionResponse = await dynamodb.query(connectionParams).promise();

    if (!connectionResponse.Items.length) {
      throw new Error('Could not find a matching registered user');
    }

    const messagesQuery = {
      TableName: CHAT_TABLE,
      ExpressionAttributeValues: {
        ':v1': {
          N: leagueId
        }
      },
      KeyConditionExpression: 'LeagueId = :v1'
    };

    const response = await dynamodb.query(messagesQuery).promise();

    const messages = response.Items.map(message => {
      return {
        LeagueId: message.LeagueId.N,
        UserId: message.UserId.N,
        Alias: message.Alias.S,
        MessageId: message.MessageId.S,
        Timestamp: message.Timestamp.N,
        Content: message.Content.S
      };
    });

    callback(null, messages);
  } catch (error) {
    console.log(error);
    callback(null, error);
  }
}