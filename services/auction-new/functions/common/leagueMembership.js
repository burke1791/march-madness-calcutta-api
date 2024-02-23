
/**
 * @typedef LeagueMembership
 * @property {Number} leagueMembershipId
 * @property {Number} userId
 * @property {String} alias
 * @property {String} cognitoSub
 * @property {Number} roleId
 * @property {Number} roleName
 */

/**
 * @function
 * @param {Array} leagueMemberships
 * @returns {Array<LeagueMembership>}
 */
export function parseLeagueMemberships(leagueMemberships) {
  return leagueMemberships.map(lm => {
    return {
      leagueMembershipId: +lm.M.leagueMembershipId.N,
      userId: +lm.M.userId.N,
      alias: lm.M.alias.S,
      cognitoSub: lm.M.cognitoSub.S,
      roleId: +lm.M.roleId.N,
      roleName: lm.M.roleName.S
    }
  });
}