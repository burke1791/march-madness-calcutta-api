
/**
 * @typedef LeagueUserMetadata
 * @property {Number} UserId
 * @property {String} Alias
 * @property {Number} NaturalBuyIn
 * @property {Number} TaxBuyIn
 * @property {Number} TotalReturn
 * @property {Number} NumTeams
 */

/**
 * @typedef ParsedLeagueUserMetadata
 * @property {Number} userId
 * @property {String} alias
 * @property {Number} naturalBuyIn
 * @property {Number} taxBuyIn
 * @property {Number} totalReturn
 * @property {Number} totalBuyIn
 * @property {Number} netReturn
 * @property {Number} numTeams
 */

/**
 * @function
 * @param {LeagueUserMetadata} data 
 * @returns {ParsedLeagueUserMetadata}
 */
export function parseLeagueUserMetadata(data) {
  return {
    userId: data.UserId,
    alias: data.Alias,
    naturalBuyIn: data.NaturalBuyIn,
    taxBuyIn: data.TaxBuyIn,
    totalReturn: data.TotalReturn,
    totalBuyIn: Number(data.NaturalBuyIn + data.TaxBuyIn),
    netReturn: Number(data.TotalReturn - data.NaturalBuyIn - data.TaxBuyIn),
    numTeams: data.NumTeams
  };
}