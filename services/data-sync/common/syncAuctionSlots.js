import AWS from 'aws-sdk';
import { LAMBDAS } from '../utilities/constants';

const lambda = new AWS.Lambda();

export async function syncAuctionSlots(leagueId, data) {
  const lambdaParams = {
    FunctionName: LAMBDAS.SYNC_AUCTION_SLOTS,
    LogType: 'Tail',
    Payload: JSON.stringify({ leagueId: leagueId, data: data })
  };

  try {
    const lambdaResponse = await lambda.invoke(lambdaParams).promise();
    console.log(lambdaResponse);
  } catch (error) {
    console.log(error);
    console.log('Unable to sync auction slots');
  }
}