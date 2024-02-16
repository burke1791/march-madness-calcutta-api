import AWS from 'aws-sdk';
import { verifyLeagueConnection, websocketBroadcast, websocketBroadcastToConnection } from '../utilities';
import { DYNAMODB_TABLES } from '../utilities/constants';
import { getAuctionStatus } from './common/getAuctionStatus';

const AUCTION_TABLE = DYNAMODB_TABLES.AUCTION_TABLE;
const AUCTION_RESULTS_TABLE = DYNAMODB_TABLES.AUCTION_RESULTS_TABLE;

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

    const auctionState = await getAuctionStatus(leagueId);
    console.log(auctionState);

    const timestamp = new Date().valueOf();
    const tsCond = (timestamp - 3000).toString();

    const itemCompleteParams = {
      ReturnItemCollectionMetrics: 'SIZE',
      TransactItems: [
        {
          ConditionCheck: {
            TableName: AUCTION_TABLE,
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
              ':S_cond': {
                S: 'bidding'
              },
              ':TS_cond': {
                N: (timestamp - 3000).toString() // hacky way to make sure we're not selling an item due to an unfortunate race condition
              }
            },
            ConditionExpression: '#S = :S_cond and #TS < :TS_cond'
          }
        },
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
                N: tsCond // hacky way to make sure we're not selling an item due to an unfortunate race condition
              }
            },
            UpdateExpression: 'SET #S = :S',
            ConditionExpression: '#S = :S_cond and #TS < :TS_cond'
          }
        },
        {
          Update: {
            TableName: AUCTION_RESULTS_TABLE,
            Key: {
              LeagueId: {
                N: String(leagueId)
              }
            },
            ExpressionAttributeNames: {
              '#AR': 'AuctionResults'
            },
            ExpressionAttributeValues: {
              ':AR': {
                L: constructDynamodbAuctionResultItem(
                  auctionState.CurrentItemId,
                  auctionState.ItemTypeId,
                  auctionState.CurrentItemWinner,
                  auctionState.Alias,
                  auctionState.CurrentItemPrice
                )
              },
              ':EL': { L: [] }
            },
            UpdateExpression: 'SET #AR = list_append(if_not_exists(#AR, :EL), :AR)'
          }
        }
      ]
    }
    console.log(itemCompleteParams);

    const itemCompleteResponse = await dynamodb.transactWriteItems(itemCompleteParams).promise();
    console.log(itemCompleteResponse);

    const newAuctionState = await getAuctionStatus(leagueId);

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

function constructDynamodbAuctionResultItem(itemId, itemTypeId, userId, alias, price) {
  return [
    {
      M: {
        itemId: {
          N: String(itemId)
        },
        itemTypeId: {
          N: String(itemTypeId)
        },
        userId: {
          N: String(userId)
        },
        alias: {
          S: alias
        },
        price: {
          N: String(price)
        }
      }
    }
  ];
}