import { BigInt, connection, TinyInt, Varchar } from '../../../../common/utilities/db';

export async function resetAuctionItem(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const cognitoSub = event.cognitoPoolClaims.sub;
  const leagueId = event.path.leagueId;
  const { itemId, itemTypeId } = event.body;

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const result = await connection.pool.request()
      .input('CognitoSub', Varchar(256), cognitoSub)
      .input('LeagueId', BigInt, leagueId)
      .input('ItemId', BigInt, itemId)
      .input('ItemTypeId', TinyInt, itemTypeId)
      .execute('dbo.up_AdminResetAuctionItem');

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}