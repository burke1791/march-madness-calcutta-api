
/**
 * @typedef UpcomingGame
 * @property {Number} GameId
 * @property {Number} HomeTeamId
 * @property {String} HomeTeamName
 * @property {Number} HomeTeamSeed
 * @property {Number} HomeTeamOwnerId
 * @property {String} HomeTeamOwnerAlias
 * @property {Number} AwayTeamId
 * @property {String} AwayTeamName
 * @property {Number} AwayTeamSeed
 * @property {Number} AwayTeamOwnerId
 * @property {String} AwayTeamOwnerAlias
 * @property {Date} EventDate
 */

/**
 * @typedef ParsedUpcomingGame
 * @property {Number} gameId
 * @property {Number} homeTeamId
 * @property {String} homeTeamName
 * @property {Number} homeTeamSeed
 * @property {Number} homeTeamOwnerId
 * @property {String} homeTeamOwnerAlias
 * @property {Number} awayTeamId
 * @property {String} awayTeamName
 * @property {Number} awayTeamSeed
 * @property {Number} awayTeamOwnerId
 * @property {String} awayTeamOwnerAlias
 * @property {Date} eventDate
 */

/**
 * @function
 * @param {Array<UpcomingGame>} data 
 * @returns {Array<ParsedUpcomingGame>}
 */
export function parseUpcomingGames(data) {
  if (data && data.length) {
    return data.map(g => {
      return {
        gameId: g.GameId,
        homeTeamId: g.HomeTeamId,
        homeTeamName: g.HomeTeamName,
        homeTeamSeed: g.HomeTeamSeed,
        homeTeamOwnerId: g.HomeTeamOwnerId,
        homeTeamOwnerAlias: g.HomeTeamOwnerAlias,
        awayTeamId: g.AwayTeamId,
        awayTeamName: g.AwayTeamName,
        awayTeamSeed: g.AwayTeamSeed,
        awayTeamOwnerId: g.AwayTeamOwnerId,
        awayTeamOwnerAlias: g.AwayTeamOwnerAlias,
        eventDate: g.EventDate
      };
    });
  }

  return [];
}