import AWS from 'aws-sdk';
import { DYNAMODB_TABLES } from '../../utilities/constants';

const dynamodb = new AWS.DynamoDB();

/**
 * @function
 * Scans the AuctionLedger table and returns an array of sold items
 * @param {Number} leagueId 
 * @returns {Array}
 */
export async function getAuctionSales(leagueId) {
  const params = {
    TableName: DYNAMODB_TABLES.AUCTION_LEDGER_TABLE,
    ExpressionAttributeValues: {
      ':id': {
        N: String(leagueId)
      }
    },
    KeyConditionExpression: 'LeagueId = :id'
  };

  const data = await dynamodb.query(params).promise();
  console.log(data);

  const parsedLedger = parseAuctionLedger(data.Items);
  console.log(parsedLedger);

  return findAuctionSales(parsedLedger);
}

function findAuctionSales(ledger) {
  if (!Array.isArray(ledger)) return [];

  const sales = ledger.filter(l => l.ledgerAction == 'SALE' || l.ledgerAction == 'REFUND');

  const lots = [];

  sales.forEach(s => {
    const itemId = s.itemId;
    const itemTypeId = s.itemTypeId;

    const lot = lots.find(l => l.itemId === itemId && l.itemTypeId === itemTypeId);

    if (lot == undefined) {
      const newLot = {
        itemId: itemId,
        itemTypeId: itemTypeId,
        sales: [s]
      };

      lots.push(newLot);
    } else {
      lot.sales.push(s);
    }
  });

  lots.forEach(l => {
    l.sales.sort((a, b) => b.ledgerId - a.ledgerId);
  });

  const finalSales = [];

  lots.forEach(l => {
    if (l.sales[0].ledgerAction === 'SALE') {
      finalSales.push(l.sales[0]);
    }
  });

  return finalSales;
}

function parseAuctionLedger(ledger) {
  if (!Array.isArray(ledger)) return [];

  return ledger.map(l => {
    return {
      leagueId: +l.N.LeagueId,
      ledgerId: +l.N.LedgerId,
      alias: l.S.Alias,
      itemId: +l.N.ItemId,
      itemTypeId: +l.N.itemTypeId,
      ledgerAction: l.S.LedgerAction,
      price: +l.N.Price,
      userId: +l.N.UserId
    }
  });
}