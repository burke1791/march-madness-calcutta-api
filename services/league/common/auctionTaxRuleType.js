import mssql, { BigInt, Bit, Decimal } from 'mssql';

/**
 * @typedef AuctionTaxRule
 * @property {Number} [auctionTaxRuleId]
 * @property {Number} [minThreshold]
 * @property {Number} [maxThreshold]
 * @property {Number} [taxRate]
 * @property {Boolean} isDeleted
 */

/**
 * @function populateAuctionTaxRuleTVP
 * @param {Array<AuctionTaxRule>} rules
 * @returns a sql server table-valued parameter populated with the provided tax rules
 */
export function populateAuctionTaxRuleTypeTVP(rules) {
  const tvp = new mssql.Table();

  tvp.columns.add('AuctionTaxRuleId', BigInt, { nullable: true });
  tvp.columns.add('MinThresholdExclusive', Decimal(8, 2), { nullable: true });
  tvp.columns.add('MaxThresholdInclusive', Decimal(8, 2), { nullable: true });
  tvp.columns.add('TaxRate', Decimal(4, 2), { nullable: true });
  tvp.columns.add('IsDeleted', Bit, { nullable: true });

  rules.forEach(rule => {
    tvp.rows.add(
      rule.auctionTaxRuleId,
      rule.minThreshold,
      rule.maxThreshold,
      rule.taxRate,
      rule.isDeleted
    );
  });

  return tvp;
}