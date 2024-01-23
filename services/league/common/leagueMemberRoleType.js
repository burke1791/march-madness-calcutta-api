import mssql from 'mssql';

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

  tvp.columns.add('LeagueId', mssql.BigInt, { nullable: false });
  tvp.columns.add('UserId', mssql.BigInt, { nullable: false });
  tvp.columns.add('RoleId', mssql.TinyInt, { nullable: false });

  roles.forEach(role => {
    tvp.rows.add(
      +role.leagueId,
      +role.userId,
      +role.roleId
    );
  });

  return tvp;
}