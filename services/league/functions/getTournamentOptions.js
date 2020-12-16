import { Varchar } from '../../../common/utilities/db';

const connection = require('../../../common/utilities/db').connection;

export async function getTournamentOptions(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  let cognitoSub = event.cognitoPoolClaims.sub;

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    let result = await connection.pool.request()
      .input('CognitoSub', Varchar(256), cognitoSub)
      .execute('dbo.up_GetTournamentOptions');

    console.log(result);

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}