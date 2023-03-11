import { BigInt, connection, Varchar } from "../../../common/utilities/db";
import { populateAuctionBidRuleTypeTVP } from "../common/auctionBidRuleType";

export async function getAuctionBidRules(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const cognitoSub = event.cognitoPoolClaims.sub;
  const leagueId = event.path.leagueId;

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const result = await connection.pool.request()
      .input('LeagueId', BigInt, leagueId)
      .input('CognitoSub', Varchar(256), cognitoSub)
      .execute('dbo.up_GetAuctionBidRules');

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, error);
  }
}

export async function setAuctionBidRules(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const cognitoSub = event.cognitoPoolClaims.sub;
  const leagueId = event.path.leagueId;
  const { rules } = event.body;

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const tvp = populateAuctionBidRuleTypeTVP(rules);

    const result = await connection.pool.request()
      .input('LeagueId', BigInt, leagueId)
      .input('CognitoSub', Varchar(256), cognitoSub)
      .input('AuctionBidRules', tvp)
      .execute('dbo.up_SetAuctionBidRules');

    // broadcast a websocket message to anyone connected to the auction room
    

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, error);
  }
}