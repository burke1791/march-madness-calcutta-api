import mssql from 'mssql';
import { BigInt, Bit, Decimal, Varchar } from '../../../common/utilities/db';

/**
 * @typedef LeagueTeamPayout
 * @property {Number} [LeagueTeamPayoutId]
 * @property {Number} TeamId
 * @property {Number} PayoutAmount
 * @property {Number} UpdatedByUserId
 * @property {String} PayoutDescription
 * @property {Boolean} IsDeleted
 */

/**
 * @function
 * @param {Array<LeagueTeamPayout>} payouts 
 * @returns a sql server table-valued parameter with the provided bidding rules
 */
export function populateLeagueTeamPayoutTypeTVP(payouts) {
  const tvp = new mssql.Table();

  tvp.columns.add('LeagueTeamPayoutId', BigInt, { nullable: true });
  tvp.columns.add('TeamId', BigInt, { nullable: false });
  tvp.columns.add('PayoutAmount', Decimal(8, 2), { nullable: false });
  tvp.columns.add('UpdatedByUserId', BigInt, { nullable: false });
  tvp.columns.add('PayoutDescription', Varchar(500), { nullable: true });
  tvp.columns.add('IsDeleted', Bit, { nullable: false });

  payouts.forEach(payout => {
    tvp.rows.add(
      payout.LeagueTeamPayoutId ? +payout.LeagueTeamPayoutId : null,
      +payout.TeamId,
      +payout.PayoutAmount,
      +payout.UpdatedByUserId,
      payout.PayoutDescription ? payout.PayoutDescription : null,
      payout.IsDeleted
    );
  });

  return tvp;
}