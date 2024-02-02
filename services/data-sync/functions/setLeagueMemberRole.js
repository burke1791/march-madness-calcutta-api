import AWS from 'aws-sdk';
import { LAMBDAS } from '../utilities/constants';
import { syncLeagueMembershipData } from '../common/syncLeagueMembershipData';

const lambda = new AWS.Lambda();

export async function setLeagueMemberRole(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const cognitoSub = event.cognitoPoolClaims.sub;
  const leagueId = event.path.leagueId;
  const { roles } = event.body;

  try {
    const lambdaParams = {
      FunctionName: LAMBDAS.SQL_SET_LEAGUE_MEMBER_ROLE,
      LogType: 'Tail',
      Payload: JSON.stringify({
        cognitoSub: cognitoSub,
        leagueId: leagueId,
        roles: roles
      })
    };

    const result = await lambda.invoke(lambdaParams).promise();
    console.log(result);

    const data = JSON.parse(result.Payload);

    if (!data[0]?.Error) {
      const leagueId = data[0].LeagueId;

      await syncLeagueMembershipData(leagueId, data);
    }

    callback(null, data);
  } catch (error) {
    console.log(error);
    callback(null, error);
  }
}