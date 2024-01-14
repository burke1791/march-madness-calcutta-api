import { BigInt, connection, Varchar } from "../../../common/utilities/db";
import { populateLeagueTeamPayoutTypeTVP } from "../common/leagueTeamPayoutType";

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

export async function setLeagueTeamPayouts(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const cognitoSub = event.cognitoPoolClaims.sub;
  const leagueId = event.path.leagueId;
  const { payouts } = event.body;

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const tvp = populateLeagueTeamPayoutTypeTVP(payouts);

    console.log(payouts);
    console.log(tvp);

    const result = await connection.pool.request()
      .input('LeagueId', BigInt, leagueId)
      .input('CognitoSub', Varchar(256), cognitoSub)
      .input('Payouts', mssql.TVP, tvp)
      .execute('dbo.up_SetLeagueTeamPayouts');

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, error);
  }
}