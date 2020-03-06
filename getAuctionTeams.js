import { success, failure } from './libraries/response-lib';

const connection = require('./db').connection;
const verifyToken = require('./libraries/verify').verifyToken;

export async function getAuctionTeams(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    let cognitoSub = await verifyToken(event.headers['x-cognito-token']);
    let leagueId = event.pathParameters.leagueId;

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    let query = `Select t.id, lt.price, t.name, tt.seed, lt.userId From dbo.leagueTeams lt Inner Join dbo.teams t On lt.teamId = t.id Inner Join dbo.leagues l On lt.leagueId = l.id Inner Join dbo.tournamentTeams tt On lt.teamId = tt.teamId And l.tournamentId = tt.tournamentId Inner Join dbo.leagueMemberships lm On lt.leagueId = lm.leagueId Inner Join dbo.users u On lm.userId = u.id Where lt.leagueId = ${leagueId} And u.cognitoSub = '${cognitoSub}'`;

    let result = await connection.pool.request().query(query);

    callback(null, success(result.recordset));
  } catch (error) {
    console.log(error);
    callback(null, failure({ message: 'ERROR!' }));
  }
}