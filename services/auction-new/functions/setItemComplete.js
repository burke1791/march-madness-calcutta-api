import AWS from 'aws-sdk';
import { verifyLeagueConnection, websocketBroadcast, websocketBroadcastToConnection } from '../utilities';
import { DYNAMODB_TABLES, LEDGER_ACTION } from '../utilities/constants';
import { getAuctionStatus } from './common/auctionStatus';
import { constructAuctionLedgerItem } from './common/auctionLedger';

const AUCTION_TABLE = DYNAMODB_TABLES.AUCTION_TABLE;
const AUCTION_LEDGER_TABLE = DYNAMODB_TABLES.AUCTION_LEDGER_TABLE;

const dynamodb = new AWS.DynamoDB();


export async function setItemComplete(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const data = JSON.parse(event.body);
  console.log(data);

  const leagueId = data.leagueId;
  const connectionId = event.requestContext.connectionId;

  try {
    const verifyResponse = await verifyLeagueConnection(leagueId, connectionId);

    if (verifyResponse === false || +verifyResponse.RoleId > 2) {
      throw new Error('User is not allowed to perform this action');
    }

    const timestamp = new Date().valueOf();
    // hacky way to make sure we're not selling an item due to an unfortunate race condition
    const tsCond = (timestamp - 3000).toString();

    const auctionState = await getAuctionStatus(leagueId);
    console.log(auctionState);

    const ledgerSale = constructAuctionLedgerItem({
      leagueId: leagueId,
      ledgerId: timestamp,
      ledgerAction: LEDGER_ACTION.SALE,
      itemId: auctionState.CurrentItemId,
      itemTypeId: auctionState.ItemTypeId,
      userId: auctionState.CurrentItemWinner,
      alias: auctionState.Alias,
      price: auctionState.CurrentItemPrice
    });

    const itemCompleteParams = {
      ReturnItemCollectionMetrics: 'SIZE',
      TransactItems: [
        {
          Update: {
            TableName: AUCTION_TABLE,
            // ReturnValues: 'ALL_NEW',
            Key: {
              LeagueId: {
                N: String(leagueId)
              }
            },
            ExpressionAttributeNames: {
              '#TS': 'LastBidTimestamp',
              '#S': 'Status'
            },
            ExpressionAttributeValues: {
              ':S': {
                S: 'confirmed-sold'
              },
              ':S_cond': {
                S: 'bidding'
              },
              ':TS_cond': {
                N: tsCond
              }
            },
            UpdateExpression: 'SET #S = :S',
            ConditionExpression: '#S = :S_cond and #TS < :TS_cond'
          }
        },
        {
          Put: {
            TableName: AUCTION_LEDGER_TABLE,
            Item: ledgerSale
          }
        }
      ]
    }
    console.log(itemCompleteParams);

    const itemCompleteResponse = await dynamodb.transactWriteItems(itemCompleteParams).promise();
    console.log(itemCompleteResponse);

    const newAuctionState = await getAuctionStatus(leagueId);

    if (newAuctionState.Status !== 'confirmed-sold') {
      throw new Error('Unable to mark item sold');
    }

    const payload = {
      msgObj: newAuctionState,
      msgType: 'auction_sale'
    }

    await websocketBroadcast(leagueId, payload, event.requestContext.domainName, event.requestContext.stage);

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ message: 'item sold' })
    });
  } catch (error) {
    console.log(error);

    const endpoint = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
    const payload = {
      msgType: 'auction_error',
      message: 'Unable to mark the item sold'
    };
    await websocketBroadcastToConnection(endpoint, event.requestContext.connectionId, payload);

    callback(null, {
      statusCode: 500,
      body: JSON.stringify({ message: 'error selling item '})
    });
  }
}