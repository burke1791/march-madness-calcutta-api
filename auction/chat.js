import { success, failure } from '../libraries/response-lib';

import { connection } from '../db';
import { verifyToken } from '../libraries/verify';

export async function getAllMessages(event, context, callback) {
  try {
    context.callbackWaitsForEmptyEventLoop = false;

    let cognitoSub = await verifyToken(event.headers['x-cognito-token']);
    let leagueId = event.pathParameters.leagueId;

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    let query = `Select  c.id
        ,   c.leagueId
        ,   c.userId
        ,   u.alias
        ,   c.content
        ,   c.[timestamp]
    From dbo.auctionChat c
    Inner Join dbo.users u
    On c.userId = u.id
    Where c.leagueId = ${leagueId}
    And Exists (
      Select *
      From dbo.leagueMemberships lm
      Inner Join dbo.users u
      On lm.userId = u.id
      Where lm.leagueId = ${leagueId}
      And u.cognitoSub = '${cognitoSub}'
    )
    Order By c.[timestamp]`;

    let result = await connection.pool.request().query(query);

    callback(null, success(result.recordset));
  } catch (error) {
    console.log(error);
    callback(null, failure(error));
  }
}