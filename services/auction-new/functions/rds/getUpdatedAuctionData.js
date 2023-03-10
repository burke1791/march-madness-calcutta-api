import { BigInt, connection } from '../../../../common/utilities/db';

/**
 * @typedef AuctionSummary
 * @property {Number} LeagueId
 * @property {Number} Prizepool
 */

/**
 * @typedef AuctionTeam
 * @property {Number} ItemId
 * @property {Number} ItemTypeId
 * @property {String} TeamLogoUrl
 * @property {String} ItemTypeName
 * @property {Number} Seed
 * @property {String} ItemName
 * @property {String} DisplayName
 * @property {Number} [UserId]
 * @property {String} [Alias]
 * @property {Number} Price
 * @property {Boolean} IsComplete 
 */

/**
 * @typedef AuctionMemberBuyIn
 * @property {Number} LeagueId
 * @property {Number} UserId
 * @property {String} Alias
 * @property {Number} NaturalBuyIn
 * @property {Number} TaxBuyIn
 */

/**
 * @typedef AuctionData
 * @property {Array<AuctionSummary>} summary
 * @property {Array<AuctionTeam>} teams
 * @property {Array<AuctionMemberBuyIn>} memberBuyIns
 */

/**
 * @function
 * Returns all updated auction data required to keep the auction room page in sync
 * Caller is responsible for verifying user permissions
 * @param {Number} leagueId
 * @returns {AuctionData|false}
 */
export async function getUpdatedAuctionData(leagueId) {

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const result = await connection.pool.request()
      .input('LeagueId', BigInt, leagueId)
      .execute('dbo.up_AuctionGetUpdatedData');
      
    const summary = result.recordsets[0];
    const teams = result.recordsets[1];
    const memberBuyIns = result.recordsets[2];

    console.log(summary);
    console.log(teams);
    console.log(memberBuyIns);

    return {
      summary: summary,
      teams: teams,
      memberBuyIns: memberBuyIns
    };
  } catch (error) {
    console.log(error);

    return false;
  }
}