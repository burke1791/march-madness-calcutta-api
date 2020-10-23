const connection = require('../../../common/utilities/db').connection;

export async function getLeagueUserSummaries(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  let cognitoSub = event.cognitoPoolClaims.sub;

  try {
    let leagueId = event.path.leagueId;

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    let query = `
      Select *
      From dbo.LeagueUserSummaries lus
      Where lus.leagueId = ${leagueId} 
      And Exists (
        Select * 
        From dbo.users u2 
        Inner Join dbo.leagueMemberships lm2 
        On u2.id = lm2.userId 
        Where lm2.leagueId = ${leagueId} 
        And u2.cognitoSub = '${cognitoSub}'
      )`;

    let result = await connection.pool.request().query(query);

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}