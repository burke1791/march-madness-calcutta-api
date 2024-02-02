import { BigInt, Varchar } from '../../../common/utilities/db';

const connection = require('../../../common/utilities/db').connection;

export async function kickLeagueMember(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const { cognitoSub, leagueId, userId } = event;

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const result = await connection.pool.request()
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