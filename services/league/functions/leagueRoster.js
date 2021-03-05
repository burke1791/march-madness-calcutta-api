import { BigInt, Varchar } from '../../../common/utilities/db';

const connection = require('../../../common/utilities/db').connection;

export async function kickLeagueMember(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  let cognitoSub = event.cognitoPoolClaims.sub;
  let { leagueId, userId } = event.body;

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    let result = await connection.pool.request()
      .input('LeagueId', BigInt, leagueId)
      .input('CognitoSub', Varchar(256), cognitoSub)
      .input('UserIdToKick', BigInt, userId)
      .execute('dbo.up_KickLeagueMember');

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}