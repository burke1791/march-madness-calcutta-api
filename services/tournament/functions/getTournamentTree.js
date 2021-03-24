import { BigInt } from '../../../common/utilities/db';

const connection = require('../../../common/utilities/db').connection;

export async function getTournamentTree(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  let leagueId = event.path.leagueId;

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    let result = await connection.pool.request()
      .input('LeagueId', BigInt, leagueId)
      .execute('dbo.up_GetTournamentTree');

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR' });
  }
}