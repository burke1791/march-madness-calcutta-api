import { BigInt, connection, TinyInt } from '../../../../common/utilities/db';

export async function resetAuctionItem(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const { leagueId, itemId, itemTypeId } = event;

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const result = await connection.pool.request()
      .input('LeagueId', BigInt, leagueId)
      .input('ItemId', BigInt, itemId)
      .input('ItemTypeId', TinyInt, itemTypeId)
      .execute('dbo.up_AdminResetAuctionItem');
    
    const data = {
      ...result.recordset[0]
    };

    callback(null, data);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}