import { getAuctionStatus } from './common/auctionStatus';
import { validateUser } from './common/validateUser';
import { getAuctionSettings } from './common/auctionSettings';
import { getAuctionSales } from './common/auctionResults';
import { computeUserData } from './common/payload';

export async function getFullPayload(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const cognitoSub = event.cognitoPoolClaims.sub;
  const leagueId = event.path.leagueId;

  try {
    if (!await validateUser(leagueId, cognitoSub)) {
      throw new Error('User is not a member of this league');
    }

    const payload = {};

    payload.status = await getAuctionStatus(leagueId);

    const allSettings = await getAuctionSettings(leagueId);

    payload.settings = allSettings.settings;
    payload.taxRules = allSettings.taxRules;
    payload.bidRules = allSettings.bidRules;

    const sales = await getAuctionSales(leagueId);

    payload.slots = populateSlotsWithSales(allSettings.slots, sales);
    console.log(payload.slots);

    payload.users = await computeUserData(leagueId, payload.slots, payload.taxRules);

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

    const payload = {};

    const settings = await getAuctionSettings(leagueId, 'AuctionSettings, BidRules, TaxRules');

    payload.settings = settings.settings;
    payload.taxRules = settings.taxRules;
    payload.bidRules = settings.bidRules;

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

    const payload = {};

    payload.status = await getAuctionStatus(leagueId);

    const allSettings = await getAuctionSettings(leagueId);

    payload.settings = allSettings.settings;
    payload.taxRules = allSettings.taxRules;
    payload.bidRules = allSettings.bidRules;
    
    const sales = await getAuctionSales(leagueId);

    payload.slots = populateSlotsWithSales(allSettings.slots, sales);
    console.log(payload.slots);

    payload.users = await computeUserData(leagueId, payload.slots, payload.taxRules);

    callback(null, payload);
  } catch (error) {
    console.log(error);

    callback(null, { message: 'ERROR!' });
  }
}


function populateSlotsWithSales(slots, sales) {
  if (!Array.isArray(slots)) return [];
  
  return slots.map(s => {
    const sale = sales.find(sl => sl.itemId === s.itemId && sl.itemTypeId === s.itemTypeId);

    if (sale == undefined) {
      return {
        ...s,
        alias: null,
        userId: null,
        price: null
      };
    } else {
      return {
        ...s,
        alias: sale.alias,
        userId: sale.userId,
        price: sale.price
      }
    }
  });
}