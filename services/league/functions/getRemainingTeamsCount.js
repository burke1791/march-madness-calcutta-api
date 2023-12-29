import { BigInt, Varchar } from '../../../common/utilities/db';

const connection = require('../../../common/utilities/db').connection;

export async function getRemainingTeamsCount(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const cognitoSub = event.cognitoPoolClaims.sub;

  try {
    const leagueId = event.path.leagueId;

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const result = await connection.pool.request()
      .input('LeagueId', BigInt, leagueId)
      .input('CognitoSub', Varchar(256), cognitoSub)
      .execute('dbo.up_GetRemainingTeamsCount');

    console.log(result);

    const response = {
      leagueId: result.recordset[0].LeagueId,
      numTeamsRemaining: result.recordset[0].NumTeamsRemaining
    };

    callback(null, response);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR' });
  }
}