import { success, failure } from './libraries/response-lib';

const connection = require('./db').connection;
const verifyToken = require('./libraries/verify').verifyToken;

export async function getLeagueSummaries(event, context, callback) {
  try {
    context.callbackWaitsForEmptyEventLoop = false;

    let cognitoSub = await verifyToken(event.headers['x-cognito-token']);

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    // I hate this, I hate everything about it.  Get your damn ORM implemented!
    let result = await connection.pool.request().query(`
    Select lm.userId
      , lm.leagueId
      , l.name
      , [tournamentId] = t.id
      , [tournamentName] = t.name
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
      Inner Join dbo.leagueRoles lr 
      On lm.roleId = lr.id 
      Inner Join dbo.users u 
      On lm.userId = u.id 
      Where u.cognitoSub = '${cognitoSub}'`);

    callback(null, success(result.recordset));
  } catch (error) {
    console.log(error);
    callback(null, failure({ message: 'ERROR!' }));
  }
}