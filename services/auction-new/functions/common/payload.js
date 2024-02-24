import AWS from 'aws-sdk';
import { DYNAMODB_TABLES } from '../../utilities/constants';

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
 * @function
 * @param {Number} leagueId 
 * @param {Array} slots
 * @returns {Array<AuctionUser>}
 */
export async function computeUserData(leagueId, slots, taxRules) {
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
    console.log(teams);
    const naturalBuyIn = teams.reduce((val, t) => val + t.price);
    console.log(naturalBuyIn);

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

  // @todo
  return 0;
}