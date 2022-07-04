import { BigInt, connection, Varchar } from "../../../common/utilities/db";
import { populateAuctionTaxRuleTypeTVP } from "../common/auctionTaxRuleType";

export async function getAuctionTaxRule(event, context, callback) {
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
      .execute('dbo.up_GetLeagueTaxRules');

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, error);
  }
}

export async function setAuctionTaxRule(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const cognitoSub = event.cognitoPoolClaims.sub;
  const leagueId = event.path.leagueId;
  const { rules } = event.body;

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const tvp = populateAuctionTaxRuleTypeTVP(rules);

    const result = await connection.pool.request()
      .input('LeagueId', BigInt, leagueId)
      .input('CognitoSub', Varchar(256), cognitoSub)
      .input('AuctionTaxRules', tvp)
      .execute('dbo.up_SetLeagueTaxRules');

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, error);
  }
}