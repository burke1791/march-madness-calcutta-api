import { getAuctionStatus } from './common/auctionStatus';
import { validateUser } from './common/validateUser';
import { getAuctionSettings } from './common/auctionSettings';
import { getAuctionSales } from './common/auctionResults';
import { auctionPayload, computeUserData } from './common/payload';

export async function getFullPayload(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const cognitoSub = event.cognitoPoolClaims.sub;
  const leagueId = event.path.leagueId;

  try {
    if (!await validateUser(leagueId, cognitoSub)) {
      throw new Error('User is not a member of this league');
    }

    const payload = await auctionPayload(leagueId, 'FULL');

    callback(null, payload);
  } catch (error) {
    console.log(error);

    callback(null, { message: 'ERROR!' });
  }
}

export async function getSettingsPayload(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const cognitoSub = event.cognitoPoolClaims.sub;
  const leagueId = event.path.leagueId;

  try {
    if (!await validateUser(leagueId, cognitoSub)) {
      throw new Error('User is not a member of this league');
    }

    const payload = auctionPayload(leagueId, 'SETTINGS');

    callback(null, payload);
  } catch (error) {
    console.log(error);

    callback(null, { message: 'ERROR!' });
  }
}

export async function getAuctionSalePayload(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const cognitoSub = event.cognitoPoolClaims.sub;
  const leagueId = event.path.leagueId;

  try {
    if (!await validateUser(leagueId, cognitoSub)) {
      throw new Error('User is not a member of this league');
    }

    const payload = auctionPayload(leagueId, 'FULL');

    callback(null, payload);
  } catch (error) {
    console.log(error);

    callback(null, { message: 'ERROR!' });
  }
}