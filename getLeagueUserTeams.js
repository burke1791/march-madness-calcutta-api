import { success, failure } from './libraries/response-lib';

const connection = require('./db').connection;
const verifyToken = require('./libraries/verify').verifyToken;

export async function getLeagueUserTeams(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    let cognitoSub = await verifyToken(event.headers['x-cognito-token']);
    let leagueId = event.pathParameters.leagueId;
    let targetUserId = event.pathParameters.userId;

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    let result = await connection.pool.request().query(`
    Select lt.teamId
      , u.alias
      , tt.seed
      , t.name
      , lt.price
      , [payout] = lt.[return]
      , lm.taxBuyIn
      , tt.alive
    From dbo.leagueTeams lt
    Inner Join dbo.leagues l
    On lt.leagueId = l.id
    Inner Join dbo.tournamentTeams tt
    On l.tournamentId = tt.tournamentId
    And lt.teamId = tt.teamId
    Inner Join dbo.teams t
    On lt.teamId = t.id
    Inner Join dbo.users u
    On lt.userId = u.id
    Inner Join dbo.leagueMemberships lm
    On l.id = lm.leagueId
    And u.id = lm.userId
    Where lt.userId = ${targetUserId}
    And lt.leagueId = ${leagueId}
    And Exists (
      Select *
      From dbo.leagueMemberships lm2
      Inner Join dbo.users u
      On lm2.userId = u.id
      Where lm2.leagueId = ${leagueId}
      And u.cognitoSub = '${cognitoSub}'
    )`);

    console.log(result);

    callback(null, success(result.recordset));
  } catch (error) {
    console.log(error);
    callback(null, failure({ message: 'ERROR!' }));
  }
}