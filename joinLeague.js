import { success, failure } from './libraries/response-lib';

const connection = require('./db').connection;
const verifyToken = require('./libraries/verify').verifyToken;

export async function joinLeague(event, context, callback) {
  try {
    context.callbackWaitsForEmptyEventLoop = false;

    let body = JSON.parse(event.body);
    let name = body.name;
    let password = body.password;

    let cognitoSub = await verifyToken(event.headers['x-cognito-token']);

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    let result = await connection.pool.request().query('With cte As (Select [leagueId] = l.id From dbo.leagues l Where l.name = \'' + name + '\' And l.password = \'' + password + '\') Insert Into dbo.leagueMemberships (userId, leagueId, roleId) Select u.id, cte.leagueId, 1 From dbo.users u Cross Join cte Where u.cognitoSub = \'' + cognitoSub + '\'');

    callback(null, success(result.recordset));
  } catch (error) {
    console.log(error);
    callback(null, failure(error));
  }
}