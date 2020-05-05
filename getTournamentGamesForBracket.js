import { callbackWaitsForEmptyEventLoopFalse } from './utilities/common';
const sql = require('mssql');

const connection = require('./db').connection;

export async function getTournamentGamesForBracket(event, context, callback) {
  callbackWaitsForEmptyEventLoopFalse(context);

  let cognitoSub = event.cognitoPoolClaims.sub;

  try {
    let leagueId = event.path.leagueId;

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const request = new sql.Request();
    request.input('leagueId', sql.BigInt(), leagueId);
    request.input('cognitoSub', sql.VarChar(256), cognitoSub);

    let result = await request.execute('dbo.up_GetTournamentGamesForBracket');
    console.log(result);

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}