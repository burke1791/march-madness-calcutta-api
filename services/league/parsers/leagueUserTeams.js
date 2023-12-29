
/**
 * @typedef LeagueUserTeam
 * @property {Number} TeamId
 * @property {String} Name
 * @property {Number} OwnerUserId
 * @property {String} OwnerUsername
 * @property {Number} IsTeamType
 * @property {Number} [GroupId]
 * @property {String} [GroupName]
 * @property {Number} [Seed]
 * @property {Number} Price
 * @property {Number} Payout
 * @property {Number} IsAlive
 */

/**
 * @typedef GroupTeam
 * @property {Number} id
 * @property {String} name
 * @property {Number} [seed]
 * @property {Number} payout
 * @property {Boolean} eliminated
 */

/**
 * @typedef ParsedLeagueUserTeam
 * @property {Number} id
 * @property {String} name
 * @property {Boolean} groupFlag
 * @property {Number} [seed]
 * @property {Number} price
 * @property {Number} payout
 * @property {Number} netReturn
 * @property {Boolean} eliminated
 * @property {Array<GroupTeam>} [groupTeams]
 */

/**
 * @function
 * @param {Array<LeagueUserTeam>} data 
 * @returns {Array<ParsedLeagueUserTeam>}
 */
export function parseLeagueUserTeams(data) {
  const userTeams = [];
  const groups = [];
  const groupsProcessed = [];

  data.forEach(team => {
    const groupName = team.GroupName;

    // team is part of a group AND that group has NOT already been handled
    if (groupName != null && !groupsProcessed.includes(groupName)) {
      const groupPayout = calculateGroupPayout(data, team.GroupId);
      const groupNetReturn = groupPayout - team.Price;

      const group = {
        id: team.GroupId,
        name: team.GroupName,
        groupFlag: true,
        price: team.Price,
        payout: groupPayout,
        netReturn: groupNetReturn,
        eliminated: teamGroupIsEliminated(data, team.GroupId),
        groupTeams: parseGroupTeams(data, team.GroupId)
      };

      groupsProcessed.push(groupName);
      groups.push(group);
    } else if (groupName == null) {
      const userTeam = {
        id: team.TeamId,
        name: team.Name,
        groupFlag: false,
        seed: team.Seed,
        price: team.Price,
        payout: team.Payout,
        netReturn: team.Payout - team.Price,
        eliminated: !team.IsAlive
      };

      userTeams.push(userTeam);
    }
  });

  return [...userTeams, ...groups];
}

/**
 * @function
 * @param {Array<LeagueUserTeam>} data 
 * @param {Number} groupId 
 * @returns {Number}
 */
function calculateGroupPayout(data, groupId) {
  return data.reduce((payout, team) => {
    if (team.GroupId === groupId) {
      return payout + team.Payout;
    }
    return payout;
  }, 0);
}

/**
 * @function
 * @param {Array<LeagueUserTeam>} data 
 * @param {Number} groupId 
 * @returns {Boolean}
 */
function teamGroupIsEliminated(data, groupId) {
  let eliminated = true;

  data.forEach(team => {
    if (team.GroupId === groupId) {
      if (!!team.IsAlive) {
        eliminated = false;
      }
    }
  });

  return eliminated;
}

/**
 * @function
 * @param {Array<LeagueUserTeam>} data 
 * @param {Number} groupId 
 * @returns {Array<GroupTeam>}
 */
function parseGroupTeams(data, groupId) {
  const groupTeams = [];

  data.forEach(team => {
    if (team.GroupId === groupId) {
      const groupTeam = {
        id: team.TeamId,
        name: team.Name,
        seed: team.Seed,
        payout: team.Payout,
        eliminated: !team.IsAlive
      };

      groupTeams.push(groupTeam);
    }
  });

  return groupTeams;
}