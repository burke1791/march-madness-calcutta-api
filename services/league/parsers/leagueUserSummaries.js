
/**
 * @typedef LeagueUserSummary
 * @property {Number} LeagueId
 * @property {String} LeagueName
 * @property {Number} TournamentId
 * @property {String} TournamentName
 * @property {Number} LeagueStatusId
 * @property {String} LeagueStatus
 * @property {Number} UserId
 * @property {String} Alias
 * @property {Number} NaturalBuyIn
 * @property {Number} TaxBuyIn
 * @property {Number} TotalReturn
 * @property {Number} NumTeams
 * @property {Number} NumTeamsAlive
 * @property {Number} RoleId
 * @property {String} Role
 */

/**
 * @typedef ParsedLeagueUserSummary
 * @property {Number} userId
 * @property {String} alias
 * @property {Number} naturalBuyIn
 * @property {Number} taxBuyIn
 * @property {Number} totalReturn
 * @property {Number} numTeams
 * @property {Number} numTeamsAlive
 * @property {Number} roleId
 * @property {String} role
 */

/**
 * @typedef ParsedLeagueUsers
 * @property {Number} leagueId
 * @property {String} leagueName
 * @property {Number} tournamentId
 * @property {String} tournamentName
 * @property {Number} leagueStatusId
 * @property {String} leagueStatus
 * @property {Array<ParsedLeagueUserSummary>} leagueUsers
 */

/**
 * @function
 * @param {Array<LeagueUserSummary>} data
 * @returns {ParsedLeagueUsers} 
 */
export function parseLeagueUserSummaries(data) {
  return {
    leagueId: +data[0].LeagueId,
    leagueName: data[0].LeagueName,
    tournamentId: +data[0].TournamentId,
    tournamentName: data[0].TournamentName,
    leagueStatusId: +data[0].LeagueStatusId,
    leagueStatus: data[0].LeagueStatus,
    leagueUsers: parseLeagueUsers(data)
  };
}

/**
 * @function
 * @param {Array<LeagueUserSummary>} data
 * @returns {Array<ParsedLeagueUserSummary>} 
 */
function parseLeagueUsers(data) {
  return data.map(u => {
    return {
      userId: +u.UserId,
      alias: u.Alias,
      naturalBuyIn: +u.NaturalBuyIn,
      taxBuyIn: +u.TaxBuyIn,
      totalReturn: +u.TotalReturn,
      numTeams: +u.NumTeams,
      numTeamsAlive: +u.NumTeamsAlive,
      roleId: +u.RoleId,
      role: u.Role
    };
  });
}