import { connection, BigInt, Decimal, Varchar, TinyInt, Bit, Int } from '../../../common/utilities/db';

export async function updateLeagueSettings(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  try {

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    let params = {
      cognitoSub: event.cognitoPoolClaims.sub,
      leagueId: event.path.leagueId,
      auctionInterval: event.path.auctionInterval,
      maxBuyIn: event.path.maxBuyIn,
      minBid: event.path.minBid,
      minBuyIn: event.path.minBuyIn,
      taxRate: event.path.taxRate,
      unclaimedAllowed: event.path.unclaimedAllowed,
      taxThreshold: event.path.taxThreshold
    };

    /*
    Validation Rules:
      * maxBuyIn must be Null, or higher than the minBuyIn AND higher than the minBid
      * taxThreshold must be Null or lower than the maxBuyIn AND higher than the minBuyIn
      * if either of taxThreshold or taxRate is Null, then the other shall be set to Null
      * minBuyIn must be Null, or higher than the minBid
    */

    let validation = true;

    if (!!params.maxBuyIn && (params.maxBuyIn < params.minBuyIn || params.maxBuyIn < params.minBid)) {
      validation = false;
    }

    if (!!params.taxThreshold && (params.taxThreshold > params.maxBuyIn || params.taxThreshold < params.minBuyIn)) {
      validation = false;
    }

    if (!params.taxThreshold || !params.taxRate) {
      params.taxThreshold = null;
      params.taxRate = null;
    }

    if (!!params.minBuyIn && params.minBuyIn < params.minBid) {
      validation = false;
    }

    if (validation) {
      let result = await connection.pool.request()
        .input('CognitoSub', Varchar(256), params.cognitoSub)
        .input('LeagueId', BigInt, params.leagueId)
        .input('AuctionInterval', TinyInt, params.auctionInterval)
        .input('MaxBuyIn', Decimal(9, 2), params.maxBuyIn)
        .input('MinBid', Decimal(9, 2), params.minBid)
        .input('MinBuyIn', Decimal(9, 2), params.minBid)
        .input('TaxRate', Decimal(9, 2), params.taxRate)
        .input('UnclaimedAllowed', Bit, params.unclaimedAllowed)
        .input('TaxThreshold', Int, params.taxThreshold)
        .execute('dbo.up_UpdateLeagueSettings_Legacy');

      console.log(result);

      callback(null, result.recordset);
    } else {
      callback(null, { message: 'Validation error' });
    }
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}