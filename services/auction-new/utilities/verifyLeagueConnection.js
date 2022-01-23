import AWS from 'aws-sdk';
import { DYNAMODB_TABLES } from './constants';

const dynamodb = new AWS.DynamoDB();

const CONNECTION_TABLE = DYNAMODB_TABLES.CONNECTION_TABLE;

/**
 * @function verifyLeagueConnection
 * @param {Number} leagueId - leagueId (primary key in SQL Server)
 * @param {String} connectionId - websocket connectionId
 * @returns {boolean}
 * @description verifies whether or not the provided leagueId and connectionId pair exist in dynamodb
 */
export async function verifyLeagueConnection(leagueId, connectionId) {
  const connectionParams = {
    TableName: CONNECTION_TABLE,
    Key: {
      ConnectionId: {
        S: connectionId
      }
    },
    ProjectionExpression: 'LeagueId, UserId, Alias'
  }

  try {
    const connectionResponse = await dynamodb.getItem(connectionParams).promise();

    const userData = {
      LeagueId: connectionResponse.Item.LeagueId.N,
      UserId: connectionResponse.Item.UserId.N,
      Alias: connectionResponse.Item.Alias.S,
      RoleId: connectionResponse.Item.RoleId.N
    };

    if (+userData.LeagueId !== +leagueId) {
      throw new Error('ConnectionId and LeagueId not found');
    }

    return userData;
  } catch (error) {
    console.log(error);
    return false;
  }
}