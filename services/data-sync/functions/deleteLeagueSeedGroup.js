import AWS from 'aws-sdk';
import { LAMBDAS } from '../utilities/constants';
import { syncAuctionSettings } from '../common/syncAuctionSettings';

const lambda = new AWS.Lambda();

export async function deleteLeagueSeedGroup(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const cognitoSub = event.cognitoPoolClaims.sub;

  const { leagueId, groupId } = event.body;

  try {
    const lambdaParams = {
      FunctionName: LAMBDAS.SQL_DELETE_SEED_GROUP,
      LogType: 'Tail',
      Payload: JSON.stringify({
        cognitoSub: cognitoSub,
        leagueId: leagueId,
        groupId: groupId
      })
    };

    const result = await lambda.invoke(lambdaParams).promise();
    console.log(result);

    const data = JSON.parse(result.Payload);

    if (!data[0]?.Error && data.length > 0) {
      await syncAuctionSettings(leagueId, 'SLOT', data);
    }

    callback(null, data);
  } catch (error) {
    console.log(error);
    callback(null, error);
  }
}