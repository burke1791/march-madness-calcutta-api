export const LAMBDAS = {
  RDS_GET_NEXT_ITEM: `calcutta-auction-service-v2-${process.env.APP_ENV}-rdsGetNextItem`,
  RDS_START_AUCTION: `calcutta-auction-service-v2-${process.env.APP_ENV}-rdsStartAuction`,
  RDS_VERIFY_USER_LEAGUE: `calcutta-auction-service-v2-${process.env.APP_ENV}-rdsVerifyUserLeague`,
  RDS_SET_ITEM_COMPLETE: `calcutta-auction-service-v2-${process.env.APP_ENV}-rdsSetItemComplete`
}

export const DYNAMODB_TABLES = {
  CONNECTION_TABLE: process.env.CONNECTION_TABLE,
  CHAT_TABLE: process.env.CHAT_TABLE,
  AUCTION_TABLE: process.env.AUCTION_TABLE,
  BID_HISTORY_TABLE: process.env.BID_HISTORY_TABLE
};

export const DYNAMODB_INDEXES = {
  CONNECTION_INDEX: `${process.env.CONNECTION_TABLE}_LeagueId_CognitoSub`
}