import { callbackWaitsForEmptyEventLoopFalse } from './utilities/common';
const connection = require('./db').connection;

export async function getRemainingGamesCount(event, context, callback) {
  callbackWaitsForEmptyEventLoopFalse(context);

  // in case we need it for future refactoring
  // let cognitoSub = event.cognitoPoolClaims.sub;

  try {
    let tournamentId = event.path.tournamentId;

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    let query = `
    Select  [numGamesRemaining] = Count(*)
    From dbo.tournamentResults tr
    Where tr.tournamentId = ${tournamentId}
    And tr.team1Score Is Null
    And tr.team2Score Is Null`;

    let result = await connection.pool.request().query(query);

    console.log(result);

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR' });
  }
}