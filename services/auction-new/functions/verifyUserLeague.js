import { BigInt, connection, Varchar } from '../../../common/utilities/db';

export async function verifyUserLeague(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  console.log(event);

  const { leagueId, cognitoSub } = event;

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    let result = await connection.pool.request()
      .input('LeagueId', BigInt, leagueId)
      .input('CognitoSub', Varchar(256), cognitoSub)
      .execute('dbo.up_VerifyLeagueUser');

    console.log(result.recordset);

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}