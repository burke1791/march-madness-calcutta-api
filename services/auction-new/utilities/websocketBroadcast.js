import AWS from 'aws-sdk';
import { DYNAMODB_INDEXES, DYNAMODB_TABLES } from './constants';

const dynamodb = new AWS.DynamoDB();

const CONNECTION_TABLE = DYNAMODB_TABLES.CONNECTION_TABLE;
const CONNECTION_INDEX = DYNAMODB_INDEXES.CONNECTION_INDEX;

/**
 * @function websocketBroadcast
 * @param {Number} leagueId - league's unique identifier
 * @param {Any} payload - Whatever you want to send to connected websocket users
 * @param {String} domainName - Websocket connection's domain
 * @param {String} apiStage - Websocket connection's api stage
 * @param {Array<String>} excludeConnectionIds - list of connectionIds to exclude from the broadcast
 * @returns {Boolean} - true if all messages are sent, false otherwise
 */
export async function websocketBroadcast(leagueId, payload, domainName, apiStage, excludeConnectionIds = []) {
  try {
    const connectionIds = await getConnectionIds(leagueId);

    if (connectionIds === false) {
      throw new Error('No connectionIds found');
    }

    const apig = new AWS.ApiGatewayManagementApi({
      apiVersion: '2018-11-29',
      endpoint: `https://${domainName}/${apiStage}`
    });

    const postCalls = connectionIds.map(async (connectionId) => {
      const params = {
        ConnectionId: connectionId,
        Data: JSON.stringify(payload)
      };

      // only broadcast if the connectionId is not in the exclude list
      if (!excludeConnectionIds.includes(connectionId)) {
        return apig.postToConnection(params).promise();
      }
    });

    await Promise.all(postCalls);
  } catch (error) {
    console.log(error);
    return false;
  }

  return true;
}

/**
 * @function websocketBroadcast
 * @param {Number} leagueId - league's unique identifier
 * @param {Any} payload - Whatever you want to send to connected websocket users
 * @param {String} endpoint - league's unique identifier
 * @param {Array<String>} excludeConnectionIds - list of connectionIds to exclude from the broadcast
 * @returns {Boolean} - true if all messages are sent, false otherwise
 */
export async function websocketBroadcastAll(leagueId, payload, endpoint) {
  try {
    const connectionIds = await getConnectionIds(leagueId);

    if (connectionIds === false) {
      return true;
    }

    const apig = new AWS.ApiGatewayManagementApi({
      apiVersion: '2018-11-29',
      endpoint: endpoint
    });

    const postCalls = connectionIds.map(async (connectionId) => {
      const params = {
        ConnectionId: connectionId,
        Data: JSON.stringify(payload)
      };

      return apig.postToConnection(params).promise();
    });

    await Promise.all(postCalls);
  } catch (error) {
    console.log(error);
    return false;
  }

  return true;
}

/**
 * @function websocketBroadcastToConnection
 * @param {String} endpoint - league's unique identifier
 * @param {String} connectionId - the connectionId to send a websocket message
 * @param {Any} payload - Whatever you want to send to connected websocket user
 * @returns {Boolean} - true if message is sent, false otherwise
 */
export async function websocketBroadcastToConnection(endpoint, connectionId, payload) {
  try {
    const apig = new AWS.ApiGatewayManagementApi({
      apiVersion: '2018-11-29',
      endpoint: endpoint
    });

    const params = {
      ConnectionId: connectionId,
      Data: JSON.stringify(payload)
    };

    await apig.postToConnection(params).promise();
  } catch (error) {
    console.log(error);
    return false;
  }

  return true;
}

/**
 * @function getConnectionIds
 * @param {Number} leagueId - league's unique identifier
 * @returns an array of connectionId strings
 */
async function getConnectionIds(leagueId) {
  const queryParams = {
    TableName: CONNECTION_TABLE,
    IndexName: CONNECTION_INDEX,
    ExpressionAttributeValues: {
      ':v1': {
        N: String(leagueId)
      }
    },
    KeyConditionExpression: 'LeagueId = :v1',
    ProjectionExpression: 'ConnectionId'
  };

  try {
    const result = await dynamodb.query(queryParams).promise();

    const connectionIds = result.Items.map((connection) => {
      return connection.ConnectionId.S
    });

    if (connectionIds.length === 0) {
      throw new Error('No connectionIds found');
    }
    
    return connectionIds;
  } catch (error) {
    console.log(error);
    return false;
  }
}