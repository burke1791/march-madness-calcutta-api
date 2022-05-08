import { connection, BigInt, Decimal, Bit, Varchar } from "../../../../common/utilities/db";


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
      .output('IsValid', Bit)
      .output('ValidationMessage', Varchar(100))
      .execute('dbo.up_AuctionVerifyBid');

    console.log(result);
    
    callback(null, result.output);
  } catch (error) {
    console.log(error);
    callback(null, error);
  }
}