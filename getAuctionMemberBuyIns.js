import { success, failure } from './libraries/response-lib';

const connection = require('./db').connection;
const verifyToken = require('./libraries/verify').verifyToken;

export async function getAuctionMemberBuyIns(event, context, callback) {
  try {
    context.callbackWaitsForEmptyEventLoop = false;

    let cognitoSub = await verifyToken(event.headers['x-cognito-token']);
    let leagueId = event.pathParameters.leagueId;

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    let query = `Select lm.userId, u.alias, lm.naturalBuyIn, lm.taxBuyIn From dbo.leagueMemberships lm Inner Join dbo.users u On lm.userId = u.id Where lm.leagueId = ${leagueId} And Exists (Select * From dbo.leagueMemberships lm2 Inner Join dbo.users u On lm2.userId = u.id Where lm2.leagueId = ${leagueId} And u.cognitoSub = '${cognitoSub}')`;

    let result = await connection.pool.request().query(query);

    callback(null, success(result.recordset));
  } catch (error) {
    console.log(error);
    callback(null, failure({ message: 'ERROR!' }));
  }
}