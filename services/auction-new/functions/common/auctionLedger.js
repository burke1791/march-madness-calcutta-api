// import AWS from 'aws-sdk';
// import { DYNAMODB_TABLES } from '../../utilities/constants';

// const dynamodb = new AWS.DynamoDB();

export function constructAuctionLedgerItem({ leagueId, ledgerId, ledgerAction, itemId, itemTypeId, userId, alias, price }) {
  return {
    LeagueId: {
      N: String(leagueId)
    },
    LedgerId: {
      N: String(ledgerId)
    },
    LedgerAction: {
      S: ledgerAction
    },
    ItemId: {
      N: String(itemId)
    },
    ItemTypeId: {
      N: String(itemTypeId)
    },
    UserId: userId == null ?
      { NULL: true } :
      { N: String(userId) },
    Alias: alias == null ?
      { NULL: true } :
      { S: alias },
    Price: price == null ?
      { NULL: true } :
      { N: String(price) }
  };
}