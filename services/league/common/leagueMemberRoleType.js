import mssql from 'mssql';
import { BigInt, TinyInt } from '../../../common/utilities/db';

/**
 * @typedef LeagueMemberRole
 * @property {Number} leagueId
 * @property {Number} userId
 * @property {Number} roleId
 */

/**
 * @function
 * @param {Array<LeagueMemberRole>} roles
 */
export function populateLeagueMemberRoleTypeTVP(roles) {
  const tvp = new mssql.Table();

  tvp.columns.add('LeagueId', BigInt, { nullable: false });
  tvp.columns.add('UserId', BigInt, { nullable: false });
  tvp.columns.add('RoleId', TinyInt, { nullable: false });

  roles.forEach(role => {
    tvp.rows.add(
      role.leagueId,
      role.userId,
      role.roleId
    );
  });

  return tvp;
}