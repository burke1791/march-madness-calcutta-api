import { BigInt, Varchar } from '../../../common/utilities/db';
import { parseLeagueUserTeams } from '../parsers/leagueUserTeams';

const connection = require('../../../common/utilities/db').connection;

export async function getLeagueUserTeams(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const cognitoSub = event.cognitoPoolClaims.sub;

  try {
    const leagueId = event.path.leagueId;
    const targetUserId = event.path.userId;

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const result = await connection.pool.request()
      .input('LeagueId', BigInt, leagueId)
      .input('CognitoSub', Varchar(256), cognitoSub)
      .input('TargetUserId', BigInt, targetUserId)
      .execute('dbo.up_GetLeagueUserTeams');

    console.log(result);

    const response = parseLeagueUserTeams(result.recordset);

    callback(null, response);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}