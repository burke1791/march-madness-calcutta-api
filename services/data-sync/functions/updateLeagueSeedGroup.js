import AWS from 'aws-sdk';
import { LAMBDAS } from '../utilities/constants';
import { syncAuctionSlots } from '../common/syncAuctionSlots';

const lambda = new AWS.Lambda();

export async function updateLeagueSeedGroup(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const cognitoSub = event.cognitoPoolClaims.sub;
  const leagueId = event.path.leagueId;

  const { groupId, groupName, groupTeams } = event.body;

  try {
    const lambdaParams = {
      FunctionName: LAMBDAS.SQL_UPDATE_SEED_GROUP,
      LogType: 'Tail',
      Payload: JSON.stringify({
        cognitoSub: cognitoSub,
        leagueId: leagueId,
        groupId: groupId,
        groupName: groupName,
        groupTeams: groupTeams
      })
    };

    const result = await lambda.invoke(lambdaParams).promise();
    console.log(result);

    const data = JSON.parse(result.Payload);

    if (!data[0]?.Error && data.length > 0) {
      await syncAuctionSlots(leagueId, data);
    }

    callback(null, data);
  } catch (error) {
    console.log(error);
    callback(null, error);
  }
}