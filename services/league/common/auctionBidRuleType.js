import mssql, { BigInt, Bit, Decimal } from 'mssql';

/**
 * @typedef AuctionBidRule
 * @property {Number} [auctionBidRuleId]
 * @property {Number} [minThreshold]
 * @property {Number} [maxThreshold]
 * @property {Number} [minIncrement]
 * @property {Boolean} isDeleted
 */

/**
 * @function populateAuctionBidRuleTypeTVP
 * @param {Array<AuctionBidRule>} rules
 * @returns a sql server table-valued parameter populated with the provided bidding rules
 */
export function populateAuctionBidRuleTypeTVP(rules) {

  const tvp = new mssql.Table();

  tvp.columns.add('AuctionBidRuleId', BigInt, { nullable: true });
  tvp.columns.add('MinThresholdExclusive', Decimal(8, 2), { nullable: true });
  tvp.columns.add('MaxThresholdInclusive', Decimal(8, 2), { nullable: true });
  tvp.columns.add('MinIncrement', Decimal(8, 2), { nullable: true });
  tvp.columns.add('IsDeleted', Bit, { nullable: true });

  rules.forEach(rule => {
    tvp.rows.add(
      rule.auctionBidRuleId,
      rule.minThreshold,
      rule.maxThreshold,
      rule.minIncrement,
      rule.isDeleted
    );
  });

  return tvp;
}