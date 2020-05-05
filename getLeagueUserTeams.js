import { callbackWaitsForEmptyEventLoopFalse } from './utilities/common';
const connection = require('./db').connection;

export async function getLeagueUserTeams(event, context, callback) {
  callbackWaitsForEmptyEventLoopFalse(context);

  let cognitoSub = event.cognitoPoolClaims.sub;

  try {
    let leagueId = event.path.leagueId;
    let targetUserId = event.path.userId;

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

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}