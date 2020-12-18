const connection = require('../../../common/utilities/db').connection;

export async function getLeagueSummaries(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  let cognitoSub = event.cognitoPoolClaims.sub;

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    // I hate this, I hate everything about it.  Get your damn ORM implemented!
    let result = await connection.pool.request().query(`
    Select lm.userId
      , lm.leagueId
      , l.name
      , [tournamentId] = t.id
      , [tournamentRegimeId] = l.TournamentRegimeId
      , [tournamentName] = t.name
      , [tournamentRegimeName] = tr.Name
      , lm.roleId
      , [role] = lr.name
      , lm.naturalBuyIn
      , lm.taxBuyIn
      , lm.totalReturn 
      From dbo.leagueMemberships lm 
      Inner Join dbo.leagues l 
      On lm.leagueId = l.id 
      Inner Join dbo.tournaments t
      On l.tournamentId = t.id
      Inner Join dbo.TournamentRegime tr
      On l.TournamentId = tr.TournamentId
      And l.TournamentRegimeId = tr.TournamentRegimeId
      Inner Join dbo.leagueRoles lr 
      On lm.roleId = lr.id 
      Inner Join dbo.users u 
      On lm.userId = u.id 
      Where u.cognitoSub = '${cognitoSub}'
      And l.IsDeleted = 0`);

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}