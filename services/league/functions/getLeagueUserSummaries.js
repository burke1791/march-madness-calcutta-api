import { BigInt, Varchar } from '../../../common/utilities/db';
import { parseLeagueUserSummaries } from '../parsers/leagueUserSummaries';

const connection = require('../../../common/utilities/db').connection;

export async function getLeagueUserSummaries(event, context, callback) {
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
      .execute('dbo.up_GetLeagueUserSummaries');

    const response = parseLeagueUserSummaries(result.recordset);

    callback(null, response);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}