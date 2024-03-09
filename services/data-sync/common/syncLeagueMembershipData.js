import AWS from 'aws-sdk';
import { LAMBDAS } from '../utilities/constants';

const lambda = new AWS.Lambda();

export async function syncLeagueMembershipData(leagueId, leagueMemberships) {
  const lambdaParams = {
    FunctionName: LAMBDAS.SYNC_LEAGUE_MEMBERSHIP,
    LogType: 'Tail',
    Payload: JSON.stringify({ leagueId: leagueId, leagueMemberships: leagueMemberships })
  };

  try {
    const lambdaResponse = await lambda.invoke(lambdaParams).promise();
    console.log(lambdaResponse);
  } catch (error) {
    console.log(error);
    console.log('Unable to sync league membership. Should I undo the SQL Server action?');
  }
}