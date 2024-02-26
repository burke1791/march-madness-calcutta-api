import AWS from 'aws-sdk';
import { DYNAMODB_TABLES } from '../../utilities/constants';
import { parseLeagueMemberships } from './leagueMembership';
import { getAuctionStatus } from './auctionStatus';
import { getAuctionSettings } from './auctionSettings';
import { getAuctionSales } from './auctionResults';

const dynamodb = new AWS.DynamoDB();

/**
 * @typedef SoldAuctionTeam
 * @property {Number} itemId
 * @property {Number} itemTypeId
 * @property {String} itemName
 * @property {String} displayName
 * @property {Number} seed
 * @property {String} itemTypeName
 * @property {String} [teamLogoUrl]
 * @property {Number} price
 * @property {Number} userId
 * @property {String} alias
 */

/**
 * @typedef AuctionUser
 * @property {Number} userId
 * @property {String} alias
 * @property {Number} naturalBuyIn
 * @property {Number} taxBuyIn
 * @property {Array<SoldAuctionTeam>} teams
 */

/**
 * @typedef AuctionPayload
 * @property {Array} [bidRules]
 * @property {Array} [settings]
 * @property {Array} [slots]
 * @property {Array} [status]
 * @property {Array} [taxRules]
 * @property {Array} [users]
 */

/**
 * @function
 * @param {Number} leagueId 
 * @param {('STATUS'|'FULL'|'SETTINGS')} payloadType 
 * @returns {AuctionPayload}
 */
export async function auctionPayload(leagueId, payloadType) {
  switch (payloadType) {
    case 'FULL':
      return await fullPayload(leagueId);
    case 'SETTINGS':
      return await settingsPayload(leagueId);
    case 'STATUS':
      return await statusPayload(leagueId);
  }
}

async function fullPayload(leagueId) {
  const payload = {};

  payload.status = await getAuctionStatus(leagueId);

  const allSettings = await getAuctionSettings(leagueId);

  payload.settings = allSettings.auctionSettings;
  payload.taxRules = allSettings.taxRules;
  payload.bidRules = allSettings.bidRules;

  const sales = await getAuctionSales(leagueId);

  const slots = populateSlotsWithSales(allSettings.slots, sales);
  payload.slots = slots;

  payload.users = await computeUserData(leagueId, payload.slots, payload.taxRules);

  return payload;
}

async function settingsPayload(leagueId) {
  const payload = {};

  const settings = await getAuctionSettings(leagueId, 'LeagueId, AuctionSettings, BidRules, TaxRules');

  payload.settings = settings.auctionSettings;
  payload.taxRules = settings.taxRules;
  payload.bidRules = settings.bidRules;

  return payload;
}

async function statusPayload(leagueId) {
  const payload = {};

  payload.status = await getAuctionStatus(leagueId);

  return payload;
}

/**
 * @function
 * @param {Number} leagueId 
 * @param {Array} slots
 * @returns {Array<AuctionUser>}
 */
async function computeUserData(leagueId, slots, taxRules) {
  const dynamodbParams = {
    TableName: DYNAMODB_TABLES.LEAGUE_MEMBERSHIP_TABLE,
    Key: {
      LeagueId: {
        N: String(leagueId)
      }
    }
  };

  const data = await dynamodb.getItem(dynamodbParams).promise();

  const leagueMemberships = parseLeagueMemberships(data.Item.LeagueMemberships.L);
  const activeMembers = leagueMemberships.filter(lm => lm.roleId != 5);

  const users = activeMembers.map(m => {
    const teams = findUserTeams(m.userId, slots);
    const naturalBuyIn = teams.reduce((val, t) => val + t.price, 0);

    return {
      userId: m.userId,
      alias: m.alias,
      naturalBuyIn: naturalBuyIn,
      taxBuyIn: calculateTax(naturalBuyIn, taxRules),
      teams: teams
    };
  });

  return users;
}

function findUserTeams(userId, slots) {
  return slots.filter(s => s.userId == userId);
}

function calculateTax(buyIn, taxRules) {
  if (!Array.isArray(taxRules)) return 0;
  if (taxRules.length == 0) return 0;

  const filteredRules = taxRules.filter(r => r.minThresholdExclusive <= buyIn);

  let tax = 0;
  filteredRules.forEach(r => {
    if (r.maxThresholdInclusive && buyIn >= r.maxThresholdInclusive) {
      tax += (r.maxThresholdInclusive - r.minThresholdExclusive) * r.taxRate;
    } else {
      tax += (buyIn - r.minThresholdExclusive) * r.taxRate;
    }
  });
  
  return tax;
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