import { connection, BigInt, Decimal } from "../../../../common/utilities/db";


export async function verifyBid(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const { leagueId, userId, bidAmount } = event;

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const result = await connection.pool.request()
      .input('LeagueId', BigInt, leagueId)
      .input('UserId', BigInt, userId)
      .input('BidAmount', Decimal, bidAmount)
      .execute('dbo.up_AuctionVerifyBid');
    
    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, error);
  }
}