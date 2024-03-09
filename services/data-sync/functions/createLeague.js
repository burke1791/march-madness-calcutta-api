import AWS from 'aws-sdk';
import { LAMBDAS } from '../utilities/constants';
import { syncLeagueMembershipData } from '../common/syncLeagueMembershipData';
import { syncAuctionSettings } from '../common/syncAuctionSettings';

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
    const memberships = data[0];

    if (memberships[0]?.Error) {
      throw new Error(memberships[0].Error);
    } else {
      const leagueId = memberships[0].LeagueId;

      await syncLeagueMembershipData(leagueId, memberships);

      const settings = data.length > 1 ? data[1] : [];

      if (settings.length > 0) {
        await syncAuctionSettings(leagueId, 'AUCTION', settings);
      }

      const lambdaSlotParams = {
        FunctionName: LAMBDAS.SQL_GET_AUCTION_SLOTS,
        LogType: 'Tail',
        Payload: JSON.stringify({ leagueId: leagueId })
      };

      const slots = await lambda.invoke(lambdaSlotParams).promise();
      console.log(slots);
      console.log(slots.Payload);

      const slotData = JSON.parse(slots.Payload);

      if (slotData.length > 0) {
        await syncAuctionSettings(leagueId, 'SLOT', slotData);
      }
    }

    callback(null, { message: 'league created' });
  } catch (error) {
    console.log(error);
    callback(null, error);
  }
}