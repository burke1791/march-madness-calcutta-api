import AWS from 'aws-sdk';
import { LAMBDAS } from '../utilities/constants';
import { syncLeagueMembershipData } from '../common/syncLeagueMembershipData';

const lambda = new AWS.Lambda();

export async function createLeague(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const cognitoSub = event.cognitoPoolClaims.sub;

  const { name, password, tournamentId, tournamentRegimeId } = event.body;

  try {
    const lambdaParams = {
      FunctionName: LAMBDAS.SQL_CREATE_LEAGUE,
      LogType: 'Tail',
      Payload: JSON.stringify({
        cognitoSub: cognitoSub,
        name: name,
        password: password,
        tournamentId: tournamentId,
        tournamentRegimeId: tournamentRegimeId
      })
    };

    const result = await lambda.invoke(lambdaParams).promise();
    console.log(result);

    const data = JSON.parse(result.Payload);

    if (data[0]?.Error) {
      throw new Error(data[0].Error);
    } else {
      const leagueId = data[0].LeagueId;

      await syncLeagueMembershipData(leagueId, data);
    }

    callback(null, { message: 'league created' });
  } catch (error) {
    console.log(error);
    callback(null, error);
  }
}