import { BigInt, Varchar } from '../../../common/utilities/db';

const connection = require('../../../common/utilities/db').connection;

export async function getLeagueMetadata(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  let cognitoSub = event.cognitoPoolClaims.sub;
  let leagueId = event.path.leagueId;

  let origin = event.headers.origin;

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    let result = await connection.pool.request()
      .input('LeagueId', BigInt, leagueId)
      .input('CognitoSub', Varchar(256), cognitoSub)
      .execute('dbo.up_GetLeagueMetadata');

    console.log(result.recordset);

    if (result.recordset[0]?.Error == undefined) {
      let leagueGuid = result.recordset[0].InviteCode;
      result.recordset[0].InviteUrl = `${origin}/joinLeague?inviteCode=${leagueGuid}`;
    }

    console.log(result.recordset);

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}