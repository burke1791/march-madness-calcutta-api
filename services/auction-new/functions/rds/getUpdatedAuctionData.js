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


export async function getUpdatedAuctionData(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const { leagueId } = event;

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

    const data = {
      summary: summary,
      teams: teams,
      memberBuyIns: memberBuyIns
    };

    callback(null, data);
  } catch (error) {
    console.log(error);

    callback(null, error);
  }
}