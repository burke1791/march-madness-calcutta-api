import { connection, BigInt, Varchar } from '../../../common/utilities/db';
import { parseUpcomingGames } from '../parsers/upcomingGames';

export async function getUpcomingGames(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const cognitoSub = event.cognitoPoolClaims.sub;

  try {
    const leagueId = event.path.leagueId;

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const result = await connection.pool.request()
      .input('CognitoSub', Varchar(256), cognitoSub)
      .input('LeagueId', BigInt, leagueId)
      .execute('dbo.up_GetUpcomingGames');

    console.log(result);

    const response = parseUpcomingGames(result.recordset);

    callback(null, response);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}