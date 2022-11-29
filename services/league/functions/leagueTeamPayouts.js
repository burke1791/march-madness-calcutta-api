import { BigInt, connection, Varchar } from "../../../common/utilities/db";

export async function getLeagueTeamPayouts(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    const cognitoSub = event.cognitoPoolClaims.sub;
    const leagueId = event.path.leagueId;

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const result = await connection.pool.request()
      .input('LeagueId', BigInt, leagueId)
      .input('CognitoSub', Varchar(256), cognitoSub)
      .execute('dbo.up_GetLeagueTeamPayouts');

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'SERVER ERROR!' });
  }
}