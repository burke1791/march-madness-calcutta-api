
import { success, failure } from './libraries/response-lib';

const connection = require('./db').connection;
const verifyToken = require('./libraries/verify').verifyToken;

export async function createLeague(event, context, callback) {
  try {
    context.callbackWaitsForEmptyEventLoop = false;

    let body = JSON.parse(event.body);
    let name = body.name;
    let password = body.password;
    let tournamentId = Number(body.tournamentId);

    let cognitoSub = await verifyToken(event.headers['x-cognito-token']);

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const query = `Insert Into dbo.leagues (name, password, year, statusId, createdBy, tournamentId) Select '${name}', '${password}', t.year, ${1}, u.id, t.id From dbo.users u Cross Join dbo.tournaments t Where u.cognitoSub = '${cognitoSub}' And t.id = ${tournamentId}`;

    await connection.pool.request().query(query);

    callback(null, success({ message: 'league created' }));
  } catch (error) {
    console.log(error);
    callback(null, failure({ message: 'ERROR!' }));
  }
}