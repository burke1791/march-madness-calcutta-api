import { Varchar } from '../../../common/utilities/db';

const connection = require('../../../common/utilities/db').connection;

export async function joinLeague(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  console.log(event);
  const { cognitoSub, inviteCode } = event;

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const result = await connection.pool.request()
      .input('CognitoSub', Varchar(256), cognitoSub)
      .input('LeagueGuid', Varchar(256), inviteCode)
      .execute('dbo.up_JoinLeague');

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, error);
  }
}