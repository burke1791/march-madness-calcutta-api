import { success, failure } from './libraries/response-lib';

const connection = require('./db').connection;
const verifyToken = require('./libraries/verify').verifyToken;

export async function getLeagueUserSummaries(event, context, callback) {
  try {
    context.callbackWaitsForEmptyEventLoop = false;

    let cognitoSub = await verifyToken(event.headers['x-cognito-token']);
    let leagueId = event.pathParameters.leagueId;

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

    callback(null, success(result.recordset));
  } catch (error) {
    console.log(error);
    callback(null, failure({ message: 'ERROR!' }));
  }
}