import { BigInt, connection, Varchar } from '../../../../common/utilities/db';

export async function resetAuction(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const { leagueId, cognitoSub } = event;

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const result = await connection.pool.request()
      .input('LeagueId', BigInt, leagueId)
      .input('CognitoSub', Varchar(256), cognitoSub)
      .execute('dbo.up_AdminResetAuction');

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}