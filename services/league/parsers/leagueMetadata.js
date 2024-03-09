
/**
 * @typedef LeagueMetadata
 * @property {String} LeagueName
 * @property {Number} NumUsers
 * @property {Number} Prizepool
 * @property {Number} MyBuyIn
 * @property {Number} MyPayout
 * @property {Number} StatusId
 * @property {Number} TournamentId
 * @property {String} TournamentName
 * @property {Number} TournamentRegimeId
 * @property {String} TournamentRegimeName
 * @property {Number} RoleId
 * @property {String} RoleName
 * @property {String} InviteCode
 * @property {String} InviteUrl
 * @property {Number} HasBracketPage
 */

/**
 * @typedef ParsedLeagueMetadata
 * @property {String} leagueName
 * @property {Number} numUsers
 * @property {Number} prizepool
 * @property {Number} myBuyIn
 * @property {Number} myPayout
 * @property {Number} statusId
 * @property {Number} tournamentId
 * @property {String} tournamentName
 * @property {Number} tournamentRegimeId
 * @property {String} tournamentRegimeName
 * @property {Number} roleId
 * @property {String} roleName
 * @property {String} inviteCode
 * @property {String} inviteUrl
 * @property {Boolean} hasBracketPage
 */

/**
 * @function
 * @param {Array<LeagueMetadata>} data
 * @returns {ParsedLeagueMetadata}
 */
export function parseLeagueMetadata(data) {
  const metadata = data[0];

  return {
    leagueName: metadata.LeagueName,
    numUsers: +metadata.NumUsers,
    prizepool: +metadata.Prizepool,
    myBuyIn: +metadata.MyBuyIn,
    myPayout: +metadata.MyPayout,
    leagueStatusId: metadata.StatusId,
    tournamentId: metadata.TournamentId,
    tournamentName: metadata.TournamentName,
    tournamentRegimeId: metadata.TournamentRegimeId,
    tournamentRegimeName: metadata.TournamentRegimeName,
    roleId: metadata.RoleId,
    roleName: metadata.RoleName,
    inviteCode: metadata.InviteCode,
    inviteUrl: metadata.InviteUrl,
    hasBracketPage: !!metadata.HasBracketPage
  };
}