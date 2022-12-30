import AWS from 'aws-sdk';
import { verifyLeagueConnection, websocketBroadcastToConnection } from '../utilities';
import { DYNAMODB_INDEXES, DYNAMODB_TABLES } from '../utilities/constants';

const dynamodb = new AWS.DynamoDB();

const CONNECTION_TABLE = DYNAMODB_TABLES.CONNECTION_TABLE;
const CONNECTION_INDEX = DYNAMODB_INDEXES.CONNECTION_INDEX;

export async function getConnectedUsers(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const data = JSON.parse(event.body);
  const leagueId = data.leagueId;
  const connectionId = event.requestContext.connectionId;
  const endpoint = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;

  try {
    // verify the leagueId matches the connection
    const verifyResponse = await verifyLeagueConnection(leagueId, connectionId);

    if (verifyResponse === false || +verifyResponse.RoleId > 2) {
      throw new Error('User is not allowed to perform this action');
    }

    const queryParams = {
      TableName: CONNECTION_TABLE,
      IndexName: CONNECTION_INDEX,
      ExpressionAttributeValues: {
        ':v1': {
          N: String(leagueId)
        }
      },
      KeyConditionExpression: 'LeagueId = :v1',
      ProjectionExpression: 'UserId, Alias, RoleId'
    };

    const result = await dynamodb.query(queryParams).promise();

    const users = result.Items.map(user => {
      return {
        ...user,
        isConnected: true
      }
    });

    const payload = {
      msgType: 'connection',
      msgObj: users
    }

    if (users.length <= 0) throw new Error('No users connected');

    await websocketBroadcastToConnection(endpoint, connectionId, payload);

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ message: 'connections found' })
    });
  } catch (error) {
    console.log(error);

    const payload = {
      msgType: 'auction_error',
      message: 'No connected users'
    };
    await websocketBroadcastToConnection(endpoint, connectionId, payload);

    callback(null, {
      statusCode: 500,
      body: JSON.stringify({ message: 'no connections found' })
    });
  }
}