import { Varchar } from '../../../common/utilities/db';

const connection = require('../../../common/utilities/db').connection;

export async function joinLeague(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  let cognitoSub = event.cognitoPoolClaims.sub;

  try {
    let { inviteCode } = event.body;

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    let result = await connection.pool.request()
      .input('CognitoSub', Varchar(256), cognitoSub)
      .input('LeagueGuid', Varchar(256), inviteCode)
      .execute('dbo.up_JoinLeague');

    if (result.recordset[0]?.Error == undefined) {
      let leagueId = result.recordset[0].LeagueId;
      result.recordset[0].LeaguePath = `/leagues/${leagueId}`;
    }

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, error);
  }
}