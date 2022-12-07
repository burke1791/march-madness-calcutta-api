import { BigInt, Varchar } from '../../../common/utilities/db';

const connection = require('../../../common/utilities/db').connection;

export async function getLeagueRoster(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const cognitoSub = event.cognitoPoolClaims.sub;
  const leagueId = event.path.leagueId;

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const result = await connection.pool.request()
      .input('LeagueId', BigInt, leagueId)
      .input('CognitoSub', Varchar(256), cognitoSub)
      .execute('dbo.up_GetLeagueRoster');

    const roster = parseRoster(result.recordset, result.recordsets[1]);

    callback(null, roster);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}

/**
 * @typedef LeagueUser
 * @property {Number} LeagueId
 * @property {Number} LeagueStatusId
 * @property {String} LeagueStatusName
 * @property {Number} UserId
 * @property {String} Username
 * @property {Number} RoleId
 * @property {String} RoleName
 * @property {Number} NumTeams
 * @property {Boolean} IsCurrentUser
 */

/**
 * @typedef LeagueRole
 * @property {Number} RoleId
 * @property {String} RoleName
 */

/**
 * @typedef LeagueUserWithAllowedRoles
 * @property {Number} LeagueId
 * @property {Number} LeagueStatusId
 * @property {String} LeagueStatusName
 * @property {Number} UserId
 * @property {String} Username
 * @property {Number} RoleId
 * @property {String} RoleName
 * @property {Number} NumTeams
 * @property {Boolean} IsCurrentUser
 * @property {Array<LeagueRole>} AllowedRoles - roles the "CurrentUser" is allowed to set for UserId
 */

/**
 * @function
 * @param {Array<LeagueUser>} members
 * @param {Array<LeagueRole>} roles
 * @returns {Array<LeagueUserWithAllowedRoles>}
 */
function parseRoster(members, roles) {
  const currentUserRoleId = members.find(m => !!m.IsCurrentUser)?.RoleId;

  const roster = members.map(m => {
    const leagueUser = Object.assign({}, m);
    leagueUser.AllowedRoles = computeAllowedRoles(currentUserRoleId, leagueUser, roles)
    return leagueUser;
  });

  return roster;
}

/**
 * @function
 * @param {Number} currentUserRoleId
 * @param {LeagueUser} leagueUser 
 * @param {Array<LeagueRole>} roles 
 */
function computeAllowedRoles(currentUserRoleId, leagueUser, roles) {
  const isAuctionClosed = leagueUser.LeagueStatusId >= 3;

  // if current user is not an admin and leagueUser is not the current user, then allowed roles is empty
  if (currentUserRoleId > 2 && !leagueUser.IsCurrentUser) return [];
  // The creator cannot change their own role
  if (currentUserRoleId == 1 && leagueUser.IsCurrentUser) return [];

  // current user is the creator
  if (currentUserRoleId == 1) {
    /*
      The creator can change the roles of all members, except for themself.
      Spectator is only allowed if the auction is closed AND the user doesn't own any teams
    */

    // All roles are available
    if (isAuctionClosed && leagueUser.NumTeams == 0) return [...roles];

    // All roles except spectator are allowed
    if (isAuctionClosed && leagueUser.NumTeams > 0) {
      return roles.filter(r => {
        return r.RoleId != 5;
      });
    }
  } else if (currentUserRoleId == 2) {
    // Admins can change the role of all non-admin members
    // Spectator rules above still apply

    // All roles are available
    if (isAuctionClosed && leagueUser.RoleId > 2 && leagueUser.NumTeams == 0) return [...roles];

    // All roles except spectator are allowed
    if (isAuctionClosed && leagueUser.RoleId > 2 && leagueUser.NumTeams > 0) {
      return roles.filter(r => {
        return r.RoleId != 5;
      });
    }
  } else {
    // All other users can toggle themselves between member and spectator
    if (isAuctionClosed && leagueUser.IsCurrentUser) {
      return roles.filter(r => {
        return r.RoleId > 2;
      });
    }

    // Unless the auction is still open
    if (!isAuctionClosed && leagueUser.IsCurrentUser) {
      return roles.filter(r => {
        return r.RoleId == 3;
      });
    }
  }

  return [];
}