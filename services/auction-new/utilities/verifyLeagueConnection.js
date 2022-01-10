import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB();

const CONNECTION_TABLE = process.env.CONNECTION_TABLE;

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
    ProjectionExpression: 'LeagueId'
  }

  try {
    const connectionResponse = await dynamodb.getItem(connectionParams).promise();

    const connectionLeagueId = connectionResponse.Item.LeagueId.N;

    console.log(leagueId);
    console.log(connectionLeagueId);
    console.log(+leagueId === +connectionLeagueId);

    return +leagueId === +connectionLeagueId;
  } catch (error) {
    console.log(error);
    return false;
  }
}