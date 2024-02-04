import AWS from 'aws-sdk';
import { LAMBDAS } from '../utilities/constants';
import { syncAuctionSettings } from '../common/syncAuctionSettings';

const lambda = new AWS.Lambda();

export async function setAuctionBidRules(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const cognitoSub = event.cognitoPoolClaims.sub;
  const leagueId = event.path.leagueId;
  const { rules } = event.body;

  try {
    const lambdaParams = {
      FunctionName: LAMBDAS.SQL_SET_AUCTION_BID_RULES,
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

    if (!response[0]?.Error && data.recordsets.length > 1) {
      const bidRules = data.recordsets[1];
      const leagueId = bidRules[0].LeagueId;

      await syncAuctionSettings(leagueId, 'BID', bidRules);
    }

    callback(null, response);
  } catch (error) {
    console.log(error);
    callback(null, error);
  }
}