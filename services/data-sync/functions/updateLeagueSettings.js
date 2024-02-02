import AWS from 'aws-sdk';
import { LAMBDAS } from '../utilities/constants';
import { syncAuctionSettings } from '../../auction-new/functions/data-sync/auctionSettings';

const lambda = new AWS.Lambda();

export async function updateLeagueSettings(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const cognitoSub = event.cognitoPoolClaims.sub;

  const { leagueId, settings } = event.body;

  try {
    const lambdaParams = {
      FunctionName: LAMBDAS.SQL_UPDATE_LEAGUE_SETTINGS,
      LogType: 'Tail',
      Payload: JSON.stringify({
        cognitoSub: cognitoSub,
        leagueId: leagueId,
        settings: settings
      })
    };

    const result = await lambda.invoke(lambdaParams).promise();
    console.log(result);

    const data = JSON.parse(result.Payload);
    const feedback = data.recordset;
    const newSettings = data.recordsets.length > 1 ? data.recordsets[1] : [];

    console.log(data);
    console.log(feedback);
    console.log(newSettings);

    if (!feedback[0]?.Error) {
      const leagueId = newSettings[0].LeagueId;

      await syncAuctionSettings(leagueId, 'AUCTION', newSettings);
    }

    callback(null, feedback);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'SERVER ERROR!' });
  }
}