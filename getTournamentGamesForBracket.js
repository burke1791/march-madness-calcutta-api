import { success, failure } from './libraries/response-lib';
const sql = require('mssql');

const connection = require('./db').connection;
const verifyToken = require('./libraries/verify').verifyToken;

export async function getTournamentGamesForBracket(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  console.log(event);

  try {
    let cognitoSub = await verifyToken(event.headers['x-cognito-token']);
    let leagueId = event.pathParameters.leagueId;

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const request = new sql.Request();
    request.input('leagueId', sql.BigInt(), leagueId);
    request.input('cognitoSub', sql.VarChar(256), cognitoSub);

    let result = await request.execute('dbo.up_GetTournamentGamesForBracket');
    console.log(result);

    callback(null, success(result.recordset));
  } catch (error) {
    console.log(error);
    callback(null, failure({ message: 'ERROR!' }));
  }
}