const mssql = require('mssql');
const connection = require('../../../common/utilities/db').connection;

export async function getTournamentGamesForBracket(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  let cognitoSub = event.cognitoPoolClaims.sub;

  try {
    let leagueId = event.path.leagueId;

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const request = connection.pool.request();
    request.input('leagueId', mssql.BigInt(), leagueId);
    request.input('cognitoSub', mssql.VarChar(256), cognitoSub);

    let result = await request.execute('dbo.up_GetTournamentGamesForBracket');
    console.log(result);

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}