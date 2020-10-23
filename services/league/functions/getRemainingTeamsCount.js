const connection = require('../../../common/utilities/db');

export async function getRemainingTeamsCount(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  // in case we need it for future refactoring
  // let cognitoSub = event.cognitoPoolClaims.sub;

  try {
    let tournamentId = event.path.tournamentId;

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    let query = `
    Select  [numTeamsRemaining] = Count(*)
    From dbo.tournamentTeams tt
    Where tt.tournamentId = ${tournamentId}
    And tt.alive = 1`;

    let result = await connection.pool.request().query(query);

    console.log(result);

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR' });
  }
}