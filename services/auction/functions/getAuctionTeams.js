import { connection } from '../../../common/utilities/db';

export async function getAuctionTeams(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  let cognitoSub = event.cognitoPoolClaims.sub;

  try {
    let leagueId = event.path.leagueId;

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    let query = `Select t.id, lt.price, t.name, tt.seed, lt.userId From dbo.leagueTeams lt Inner Join dbo.teams t On lt.teamId = t.id Inner Join dbo.leagues l On lt.leagueId = l.id Inner Join dbo.tournamentTeams tt On lt.teamId = tt.teamId And l.tournamentId = tt.tournamentId Inner Join dbo.leagueMemberships lm On lt.leagueId = lm.leagueId Inner Join dbo.users u On lm.userId = u.id Where lt.leagueId = ${leagueId} And u.cognitoSub = '${cognitoSub}'`;

    let result = await connection.pool.request().query(query);

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}