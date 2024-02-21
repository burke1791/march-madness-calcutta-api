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
    UserId: {
      N: String(userId)
    },
    Alias: {
      S: alias
    },
    Price: {
      N: String(price)
    }
  };
}