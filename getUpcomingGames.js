import { callbackWaitsForEmptyEventLoopFalse } from './utilities/common';
import mssql from 'mssql';
const connection = require('./db').connection;

export async function getUpcomingGames(event, context, callback) {
  callbackWaitsForEmptyEventLoopFalse(context);

  let cognitoSub = event.cognitoPoolClaims.sub;

  try {
    let leagueId = event.path.leagueId;

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const request = new mssql.Request();
    request.input('CognitoSub', mssql.VarChar(256), cognitoSub);
    request.input('LeagueId', mssql.BigInt(), leagueId);

    let result = await request.execute('dbo.up_GetUpcomingGames');

    console.log(result);

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}