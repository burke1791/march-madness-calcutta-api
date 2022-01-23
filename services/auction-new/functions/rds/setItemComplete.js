import { BigInt, connection, Decimal, TinyInt } from "../../../../common/utilities/db";

export async function setItemComplete(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const { leagueId, itemTypeId, itemId, userId, price } = event;

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const result = await connection.pool.request()
      .input('LeagueId', BigInt, leagueId)
      .input('ItemTypeId', TinyInt, itemTypeId)
      .input('ItemId', BigInt, itemId)
      .input('UserId', BigInt, userId)
      .input('Price', Decimal(8, 2), price)
      .execute('dbo.up_AuctionSetItemComplete')

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, error);
  }
}