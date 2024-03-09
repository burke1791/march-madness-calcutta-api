import AWS from 'aws-sdk';
import { LAMBDAS } from '../utilities/constants';
import { syncLeagueMembershipData } from '../common/syncLeagueMembershipData';

const lambda = new AWS.Lambda();

export async function joinLeague(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const cognitoSub = event.cognitoPoolClaims.sub;

  try {
    const { inviteCode } = event.body;

    const lambdaParams = {
      FunctionName: LAMBDAS.SQL_JOIN_LEAGUE,
      LogType: 'Tail',
      Payload: JSON.stringify({ cognitoSub: cognitoSub, inviteCode: inviteCode })
    };

    const result = await lambda.invoke(lambdaParams).promise();
    console.log(result);

    const data = JSON.parse(result.Payload);

    const response = [];

    if (data[0]?.Error == undefined) {
      const leagueId = data[0].LeagueId;

      response.push({ LeagueId: leagueId, LeaguePath: `/leagues/${leagueId}` });

      await syncLeagueMembershipData(leagueId, data);
    } else {
      response.push({ Error: data[0].Error });
    }

    callback(null, response);
  } catch (error) {
    console.log(error);
    callback(null, error);
  }
}