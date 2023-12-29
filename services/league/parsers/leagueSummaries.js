
/**
 * @typedef LeagueSummary
 * @property {Number} UserId
 * @property {Number} LeagueId
 * @property {String} LeagueName
 * @property {Number} IsDeleted
 * @property {Number} StatusId
 * @property {String} LeagueStatus
 * @property {Number} TournamentId
 * @property {String} TournamentName
 * @property {Number} TournamentRegimeId
 * @property {String} TournamentRegimeName
 * @property {Number} RoleId
 * @property {String} Role
 * @property {Number} NaturalBuyIn
 * @property {Number} TaxBuyIn
 * @property {Number} TotalReturn
 */

/**
 * @typedef ParsedLeagueSummary
 * @property {Number} userId
 * @property {Number} leagueId
 * @property {String} leagueName
 * @property {Boolean} isDeleted
 * @property {Number} statusId
 * @property {String} leagueStatus
 * @property {Number} tournamentId
 * @property {String} tournamentName
 * @property {Number} tournamentRegimeId
 * @property {String} tournamentRegimeName
 * @property {Number} roleId
 * @property {String} role
 * @property {Number} naturalBuyIn
 * @property {Number} taxBuyIn
 * @property {Number} totalReturn
 */

/**
 * @function
 * @param {Array<LeagueSummary>} data 
 * @returns {Array<ParsedLeagueSummary>}
 */
export function parseLeagueSummaries(data) {
  if (data && data.length) {
    return data.map(l => {
      return {
        userId: l.UserId,
        leagueId: l.LeagueId,
        leagueName: l.LeagueName,
        isDeleted: !!l.IsDeleted,
        statusId: l.StatusId,
        leagueStatus: l.LeagueStatus,
        tournamentId: l.TournamentId,
        tournamentName: l.TournamentName,
        tournamentRegimeId: l.TournamentRegimeId,
        tournamentRegimeName: l.TournamentRegimeName,
        roleId: l.RoleId,
        role: l.Role,
        naturalBuyIn: l.NaturalBuyIn,
        taxBuyIn: l.TaxBuyIn,
        totalReturn: l.TotalReturn
      };
    });
  }

  return [];
}