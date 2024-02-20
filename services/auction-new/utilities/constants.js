export const LAMBDAS = {
  RDS_GET_NEXT_ITEM: `calcutta-auction-service-v2-${process.env.APP_ENV}-rdsGetNextItem`,
  RDS_START_AUCTION: `calcutta-auction-service-v2-${process.env.APP_ENV}-rdsStartAuction`,
  RDS_VERIFY_USER_LEAGUE: `calcutta-auction-service-v2-${process.env.APP_ENV}-rdsVerifyUserLeague`,
  RDS_SET_ITEM_COMPLETE: `calcutta-auction-service-v2-${process.env.APP_ENV}-rdsSetItemComplete`,
  RDS_CLOSE_AUCTION: `calcutta-auction-service-v2-${process.env.APP_ENV}-rdsCloseAuction`,
  RDS_VERIFY_BID: `calcutta-auction-service-v2-${process.env.APP_ENV}-rdsVerifyBid`,
  RDS_RESET_AUCTION: `calcutta-auction-service-v2-${process.env.APP_ENV}-rdsResetAuction`,
  DYNAMODB_RESET_AUCTION: `calcutta-auction-service-v2-${process.env.APP_ENV}-dynamodbResetAuction`,
  RDS_RESET_ITEM: `calcutta-auction-service-v2-${process.env.APP_ENV}-rdsResetAuctionItem`,
  RDS_GET_UPDATED_AUCTION_DATA: `calcutta-auction-service-v2-${process.env.APP_ENV}-rdsGetUpdatedAuctionData`
  // SYNC_AUCTION_SLOTS: `calcutta-auction-service-v2-${process.env.APP_ENV}-syncAuctionSlots`
};

export const DYNAMODB_TABLES = {
  CONNECTION_TABLE: process.env.CONNECTION_TABLE,
  CHAT_TABLE: process.env.CHAT_TABLE,
  AUCTION_TABLE: process.env.AUCTION_TABLE,
  BID_HISTORY_TABLE: process.env.BID_HISTORY_TABLE,
  AUCTION_SETTINGS_TABLE: process.env.AUCTION_SETTINGS_TABLE,
  LEAGUE_MEMBERSHIP_TABLE: process.env.LEAGUE_MEMBERSHIP_TABLE,
  AUCTION_LEDGER_TABLE: process.env.AUCTION_LEDGER_TABLE
};

export const DYNAMODB_INDEXES = {
  CONNECTION_INDEX: `${process.env.CONNECTION_TABLE}_LeagueId_CognitoSub`
};

export const AUCTION_STATUS = {
  INITIAL: 'initial',
  BIDDING: 'bidding',
  SOLD: 'sold',
  CONFIRMED_SOLD: 'confirmed-sold',
  END: 'end'
};