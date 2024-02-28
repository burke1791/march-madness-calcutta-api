import AWS from 'aws-sdk';
import { verifyLeagueConnection, websocketBroadcastToConnection, websocketBroadcastAll } from '../utilities';
import { DYNAMODB_TABLES } from "../utilities/constants";
import { constructAuctionLedgerItem } from './common/auctionLedger';
import { auctionPayload } from './common/payload';
import { getAuctionStatus } from './common/auctionStatus';

const dynamodb = new AWS.DynamoDB();

export async function resetAuctionItem(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const data = JSON.parse(event.body);
  const { leagueId, itemId, itemTypeId } = data;
  const connectionId = event.requestContext.connectionId;

  try {
    const verifyResponse = await verifyLeagueConnection(leagueId, connectionId);

    if (verifyResponse === false || +verifyResponse.RoleId > 2) {
      throw new Error('User is not allowed to perform this action');
    }

    await resetItemInDynamoDb(leagueId, itemId, itemTypeId, verifyResponse.UserId, verifyResponse.Alias);

    const payload = await auctionPayload(leagueId, 'FULL');
    const resetSlot = payload.slots.find(s => s.itemId == itemId && s.itemTypeId == itemTypeId);
    if (resetSlot != undefined) {
      payload.message = `${verifyResponse.Alias} reset sale of ${resetSlot.displayName}`;
    }

    const websocketPayload = {
      msgObj: payload,
      msgType: 'auction_reset'
    };

    const endpoint = `https://${process.env.WEBSOCKET_ENDPOINT}`;
    await websocketBroadcastAll(leagueId, websocketPayload, endpoint);

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ message: 'item reset' })
    });
  } catch (error) {
    console.log(error);

    const endpoint = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
    const payload = {
      msgType: 'auction_error',
      message: 'Unable to reset item'
    };
    await websocketBroadcastToConnection(endpoint, connectionId, payload);

    callback(null, {
      statusCode: 500,
      body: JSON.stringify({ message: 'unable to reset item' })
    });
  }
}

async function resetItemInDynamoDb(leagueId, itemId, itemTypeId, userId, alias) {
  const auctionStatus = await getAuctionStatus(leagueId);

  if (auctionStatus.CurrentItemId == itemId && auctionStatus.ItemTypeId == itemTypeId) {
    const params = {
      ReturnItemCollectionMetrics: 'SIZE',
      TransactItems: [
        {
          Put: {
            TableName: DYNAMODB_TABLES.AUCTION_LEDGER_TABLE,
            Item: constructAuctionLedgerItem({
              leagueId: leagueId,
              ledgerId: new Date().valueOf(),
              ledgerAction: 'REFUND',
              itemId: itemId,
              itemTypeId: itemTypeId,
              userId: userId,
              alias: alias,
              price: 0
            })
          }
        },
        {
          Update: {
            TableName: DYNAMODB_TABLES.AUCTION_TABLE,
            Key: {
              LeagueId: {
                N: String(leagueId)
              }
            },
            ExpressionAttributeNames: {
              '#S': 'Status',
              '#CId': 'CurrentItemId',
              '#P': 'CurrentItemPrice',
              '#W': 'CurrentItemWinner',
              '#A': 'Alias',
              '#IT': 'ItemTypeId',
              '#PB': 'PrevBidId'
            },
            ExpressionAttributeValues: {
              ':P': {
                N: String(0)
              },
              ':W': { NULL: true },
              ':A': { NULL: true },
              ':PB': { NULL: true },
              ':S': {
                S: 'confirmed-sold'
              },
              ':CId': {
                N: String(itemId)
              },
              ':IT': {
                N: String(itemTypeId)
              }
            },
            UpdateExpression: 'SET #P = :P, #W = :W, #A = :A, #PB = :PB',
            ConditionExpression: '#S = :S and #CId = :CId and #IT = :IT'
          }
        }
      ]
    };

    const resetResponse = await dynamodb.transactWriteItems(params).promise();
    console.log(resetResponse);
    console.log(resetResponse.ItemCollectionMetrics);
  } else {
    const params = {
      TableName: DYNAMODB_TABLES.AUCTION_LEDGER_TABLE,
      Item: constructAuctionLedgerItem({
        leagueId: leagueId,
        ledgerId: new Date().valueOf(),
        ledgerAction: 'REFUND',
        itemId: itemId,
        itemTypeId: itemTypeId,
        userId: userId,
        alias: alias,
        price: 0
      })
    };

    const resetResponse = await dynamodb.putItem(params).promise();
    console.log(resetResponse);
  }
}