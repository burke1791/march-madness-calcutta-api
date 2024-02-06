import { BigInt } from 'mssql';

const connection = require('../../../common/utilities/db').connection;

export async function getAuctionSlots(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const { leagueId } = event;
  console.log(leagueId);

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const result = await connection.pool.request()
      .input('LeagueId', BigInt, leagueId)
      .execute('dbo.up_GetAuctionSlots');

    console.log(result);

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, error);
  }
}