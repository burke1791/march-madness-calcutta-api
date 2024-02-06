import AWS from 'aws-sdk';
import { LAMBDAS } from '../utilities/constants';
import { syncLeagueMembershipData } from '../common/syncLeagueMembershipData';
import { syncAuctionSlots } from '../common/syncAuctionSlots';

const lambda = new AWS.Lambda();

/**
 * League creation steps:
 * 
 * 1. Create the league in SQL Server
 * 2. Add the new league and creator to the LeagueMembership table in dynamodb
 * 3. Pull auction slot data from SQL Server
 * 4. Write slot data to dynamodb
 */
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

      const lambdaSlotParams = {
        FunctionName: LAMBDAS.SQL_GET_AUCTION_SLOTS,
        LogType: 'Tail',
        Payload: JSON.stringify({ leagueId: leagueId })
      };

      const slots = await lambda.invoke(lambdaSlotParams).promise();
      console.log(slots);
      console.log(slots.Payload);

      const slotData = JSON.parse(slots.Payload);

      await syncAuctionSlots(leagueId, slotData);
    }

    callback(null, { message: 'league created' });
  } catch (error) {
    console.log(error);
    callback(null, error);
  }
}