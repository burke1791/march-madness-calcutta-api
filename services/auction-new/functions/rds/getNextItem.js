import { BigInt, connection } from "../../../../common/utilities/db";

export async function getNextItem(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const { leagueId, itemId, itemTypeId } = event;

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const result = await connection.pool.request()
      .input('LeagueId', BigInt, leagueId)
      .input('ItemId', BigInt, itemId)
      .input('ItemTypeId', BigInt, itemTypeId)
      .execute('dbo.up_AuctionGetNextItem');

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}