export const LAMBDAS = {
  SYNC_LEAGUE_MEMBERSHIP: `calcutta-auction-service-v2-${process.env.APP_ENV}-syncLeagueMembership`,
  SYNC_AUCTION_SETTINGS: `calcutta-auction-service-v2-${process.env.APP_ENV}-syncAuctionSettings`,
  SQL_JOIN_LEAGUE: `calcutta-league-service-${process.env.APP_ENV}-joinLeague`,
  SQL_CREATE_LEAGUE: `calcutta-league-service-${process.env.APP_ENV}-createLeague`,
  SQL_KICK_MEMBER: `calcutta-league-service-${process.env.APP_ENV}-kickLeagueMember`,
  SQL_LEAVE_LEAGUE: `calcutta-league-service-${process.env.APP_ENV}-leaveLeague`,
  SQL_SET_LEAGUE_MEMBER_ROLE: `calcutta-league-service-${process.env.APP_ENV}-setLeagueMemberRole`,
  SQL_UPDATE_LEAGUE_SETTINGS: `calcutta-league-service-${process.env.APP_ENV}-updateLeagueSettings`,
  SQL_SET_AUCTION_BID_RULES: `calcutta-league-service-${process.env.APP_ENV}-setAuctionBidRules`,
  SQL_SET_AUCTION_TAX_RULES: `calcutta-league-service-${process.env.APP_ENV}-setAuctionTaxRules`
};