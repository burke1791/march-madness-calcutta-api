import { callbackWaitsForEmptyEventLoopFalse } from './utilities/common';
const connection = require('./db').connection;

export async function getUpcomingGames(event, context, callback) {
  callbackWaitsForEmptyEventLoopFalse(context);

  let cognitoSub = event.cognitoPoolClaims.sub;

  try {
    let leagueId = event.path.leagueId;

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    let query = `
      With cteGames As (
        Select Top (5)
          tr.gameId
        , [homeTeamId] = tr.team2Id
        , [homeTeamName] = t2.name
        , [homeTeamSeed] = tr.team2Seed
        , [awayTeamId] = tr.team1Id
        , [awayTeamName] = t.name
        , [awayTeamSeed] = tr.team1Seed
        , tr.eventDate
        From dbo.tournamentResults tr
        Inner Join dbo.leagues l
        On tr.tournamentId = l.tournamentId
        Left Join dbo.teams t
        On t.id = tr.team1Id
        Left Join dbo.teams t2
        On t2.id = tr.team2Id
        Where tr.team1Score Is Null
        And tr.team2Score Is Null
        And l.id = ${leagueId}
        And tr.eventDate Is Not Null
        Order By tr.eventDate
      ), cteOwners As (
        Select lt.userId
        , u.alias
        , lt.teamId
        From dbo.leagueTeams lt
        Left Join dbo.users u
        On lt.userId = u.id
        Where lt.leagueId = ${leagueId}
      )
      Select g.gameId
      , g.homeTeamId
      , g.homeTeamName
      , g.homeTeamSeed
      , [homeTeamOwnerId] = o2.userId
      , [homeTeamOwnerAlias] = o2.alias
      , g.awayTeamId
      , g.awayTeamName
      , g.awayTeamSeed
      , [awayTeamOwnerId] = o.userId
      , [awayTeamOwnerAlias] = o.alias
      , g.eventDate
      From cteGames g
      Left Join cteOwners o
      On g.awayTeamId = o.teamId
      Left Join cteOwners o2
      On g.homeTeamId = o2.teamId
      Where Exists (
        Select *
        From dbo.leagueMemberships lm
        Inner Join dbo.users u
        On lm.userId = u.id
        Where lm.leagueId = ${leagueId}
        And u.cognitoSub = '${cognitoSub}'
      )`;

    let result = await connection.pool.request().query(query);

    console.log(result);

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}