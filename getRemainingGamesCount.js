import { success, failure } from './libraries/response-lib';

const connection = require('./db').connection;

export async function getRemainingGamesCount(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    let tournamentId = event.pathParameters.tournamentId;

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

    callback(null, success(result.recordset));
  } catch (error) {
    console.log(error);
    callback(null, failure({ message: 'ERROR' }));
  }
}