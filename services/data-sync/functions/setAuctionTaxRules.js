import AWS from 'aws-sdk';
import { LAMBDAS } from '../utilities/constants';
import { syncAuctionSettings } from '../../auction-new/functions/data-sync/auctionSettings';

const lambda = new AWS.Lambda();

export async function setAuctionTaxRules(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const cognitoSub = event.cognitoPoolClaims.sub;
  const leagueId = event.path.leagueId;
  const { rules } = event.body;

  try {
    const lambdaParams = {
      FunctionName: LAMBDAS.SQL_SET_AUCTION_TAX_RULES,
      LogType: 'Tail',
      Payload: JSON.stringify({
        cognitoSub: cognitoSub,
        leagueId: leagueId,
        rules: rules
      })
    };

    const result = await lambda.invoke(lambdaParams).promise();
    console.log(result);

    const data = JSON.parse(result.Payload);
    const response = data.recordset;

    if (!response[0]?.Error && response.length > 1) {
      const taxRules = data.recordsets[1];
      const leagueId = taxRules[0].LeagueId;

      await syncAuctionSettings(leagueId, 'TAX', taxRules);
    }

    callback(null, response);
  } catch (error) {
    console.log(error);
    callback(null, error);
  }
}