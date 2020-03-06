import { success, failure } from './libraries/response-lib';

const connection = require('./db').connection;
const verifyToken = require('./libraries/verify').verifyToken;

export async function getAuctionStatus(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    let cognitoSub = await verifyToken(event.headers['x-cognito-token']);
    let leagueId = event.pathParameters.leagueId;

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    let query = `Select [status] = s.name, a.currentItemId, t.name, tt.seed, a.currentItemPrice, a.currentItemWinner, u.alias, a.lastBidTimestamp From dbo.auctions a Inner Join dbo.auctionStatus s On a.statusId = s.id Left Join dbo.teams t On a.currentItemId = t.id Inner Join dbo.leagues l On a.leagueId = l.id Left Join dbo.tournamentTeams tt On t.id = tt.teamId And l.tournamentId = tt.tournamentId Left Join dbo.users u On a.currentItemWinner = u.id Where a.leagueId = ${leagueId} And Exists (Select * From dbo.leagueMemberships lm Inner Join dbo.users u2 On lm.userId = u2.id Where lm.leagueId = ${leagueId} And u2.cognitoSub = '${cognitoSub}')`;

    let result = await connection.pool.request().query(query);

    callback(null, success(result.recordset));
  } catch (error) {
    console.log(error);
    callback(null, failure({ message: 'ERROR!' }));
  }
}