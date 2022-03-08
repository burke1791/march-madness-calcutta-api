import AWS from 'aws-sdk';
import { verifyLeagueConnection, websocketBroadcast, websocketBroadcastToConnection } from '../utilities';
import { DYNAMODB_TABLES } from '../utilities/constants';

const dynamodb = new AWS.DynamoDB();

export async function placeBid(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const data = JSON.parse(event.body);
  const leagueId = data.leagueId;
  const connectionId = event.requestContext.connectionId;
  const amount = data.amount;
  const itemId = data?.itemId;
  const itemTypeId = data?.itemTypeId;

  try {
    if (itemId == undefined || itemTypeId == undefined) {
      throw new Error('ItemId and ItemTypeId must be supplied');
    }
    // verify the leagueId matches the connection
    const verifyResponse = await verifyLeagueConnection(leagueId, connectionId);

    if (verifyResponse === false) {
      throw new Error('ConnectionId and LeagueId do not match');
    }

    const lookupParams = {
      TableName: DYNAMODB_TABLES.AUCTION_TABLE,
      Key: {
        LeagueId: {
          N: String(leagueId)
        }
      },
      ProjectionExpression: 'BidId'
    }

    const lookupResponse = await dynamodb.getItem(lookupParams).promise();

    if (!lookupResponse.Item) {
      throw new Error('There is no auction record');
    }

    const currentBidId = lookupResponse.Item.BidId.N;

    const timestamp = new Date().valueOf().toString();

    // place the bid in a transaction
    const bidParams = {
      ReturnItemCollectionMetrics: 'SIZE',
      TransactItems: [
        {
          Update: {
            TableName: DYNAMODB_TABLES.AUCTION_TABLE,
            Key: {
              LeagueId: {
                N: String(leagueId)
              }
            },
            ExpressionAttributeNames: {
              '#TS': 'LastBidTimestamp',
              '#S': 'Status',
              '#P': 'CurrentItemPrice',
              '#W': 'CurrentItemWinner',
              '#A': 'Alias',
              '#B': 'BidId',
              '#PB': 'PrevBidId'
            },
            ExpressionAttributeValues: {
              ':TS': {
                N: timestamp
              },
              ':S': {
                S: 'bidding'
              },
              ':P': {
                N: String(amount)
              },
              ':W': {
                N: verifyResponse.UserId
              },
              ':A': {
                S: verifyResponse.Alias
              },
              ':B': {
                N: timestamp // using timestamp instead of uuid because I want it to be useful in RANGE queries against the BidHistory table
              },
              ':PB': {
                N: currentBidId
              }
            },
            UpdateExpression: 'SET #TS = :TS, #P = :P, #W = :W, #A = :A, #B = :B, #PB = :PB',
            ConditionExpression: ':P > #P and #S = :S and #B = :PB'
          }
        },
        {
          Put: {
            TableName: DYNAMODB_TABLES.BID_HISTORY_TABLE,
            Item: {
              LeagueId: {
                N: String(leagueId)
              },
              BidTimestamp: {
                N: timestamp
              },
              ItemId: {
                N: String(itemId)
              },
              ItemTypeId: {
                N: String(itemTypeId)
              },
              UserId: {
                N: verifyResponse.UserId
              },
              Alias: {
                S: verifyResponse.Alias
              },
              Price: {
                N: String(amount)
              },
              BidId: {
                N: timestamp
              },
              PrevBidId: {
                N: currentBidId
              },
              Action: {
                S: 'bid'
              }
            }
          }
        }
      ]
    }

    const bidResponse = await dynamodb.transactWriteItems(bidParams).promise();

    console.log(bidResponse);
    console.log(bidResponse.ItemCollectionMetrics);

    const auctionObj = {
      Status: 'bidding',
      CurrentItemPrice: amount,
      CurrentItemWinner: verifyResponse.UserId,
      Alias: verifyResponse.Alias,
      LastBidTimestamp: timestamp
    }

    const payload = {
      msgObj: auctionObj,
      msgType: 'auction'
    }

    await websocketBroadcast(leagueId, payload, event.requestContext.domainName, event.requestContext.stage);

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ message: 'bid accepted' })
    });
  } catch (error) {
    console.log(error);

    const endpoint = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
    const payload = {
      msgType: 'auction_error',
      message: 'Bid Not Accepted'
    };
    await websocketBroadcastToConnection(endpoint, event.requestContext.connectionId, payload);

    callback(null, {
      statusCode: 500,
      body: JSON.stringify({ message: 'bid not accepted' })
    });
  }
}