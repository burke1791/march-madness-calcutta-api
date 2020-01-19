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

    let query = `Select [leagueId] = l.id, l.name, l.auctionId, l.statusId, [status] = ls.name, [userId] = u.id, u.alias, lm.naturalBuyIn, lm.taxBuyIn, lm.totalReturn, lm.roleId, [role] = lr.name From dbo.leagues l Inner Join dbo.leagueMemberships lm On l.id = lm.leagueId Inner Join dbo.leagueStatus ls On l.statusId = ls.id Inner Join dbo.leagueRoles lr On lm.roleId = lr.id Inner Join dbo.users u On lm.userId = u.id Where l.id = ${leagueId} And Exists (Select * From dbo.users u2 Inner Join dbo.leagueMemberships lm2 On u2.id = lm2.userId Where lm2.leagueId = ${leagueId} And u2.cognitoSub = '${cognitoSub}')`;

    let result = await connection.pool.request().query(query);

    callback(null, success(result.recordset));
  } catch (error) {
    console.log(error);
    callback(null, failure({ message: 'ERROR!' }));
  }
}