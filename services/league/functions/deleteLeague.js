import { BigInt, Varchar } from '../../../common/utilities/db';

const connection = require('../../../common/utilities/db').connection;

export async function deleteLeague(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const cognitoSub = event.cognitoPoolClaims.sub;
  const leagueId = event.path.leagueId;

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const result = await connection.pool.request()
      .input('LeagueId', BigInt, leagueId)
      .input('CognitoSub', Varchar(256), cognitoSub)
      .execute('dbo.up_DeleteLeague');

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'SERVER ERROR!' });
  }
}