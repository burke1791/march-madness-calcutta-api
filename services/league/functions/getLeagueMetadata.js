import { BigInt, Varchar } from '../../../common/utilities/db';
import { parseLeagueMetadata } from '../parsers/leagueMetadata';

const connection = require('../../../common/utilities/db').connection;

export async function getLeagueMetadata(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const cognitoSub = event.cognitoPoolClaims.sub;
  const leagueId = event.path.leagueId;

  const origin = event.headers.origin;

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const result = await connection.pool.request()
      .input('LeagueId', BigInt, leagueId)
      .input('CognitoSub', Varchar(256), cognitoSub)
      .execute('dbo.up_GetLeagueMetadata');

    if (result.recordset[0]?.Error == undefined) {
      const leagueGuid = result.recordset[0].InviteCode;
      result.recordset[0].InviteUrl = `${origin}/joinLeague?inviteCode=${leagueGuid}`;
    }

    const response = parseLeagueMetadata(result.recordset);

    callback(null, response);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}