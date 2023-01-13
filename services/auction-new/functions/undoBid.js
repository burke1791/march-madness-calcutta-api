import AWS from 'aws-sdk';
import { lookupPreviousBid, verifyLeagueConnection, websocketBroadcast } from '../utilities';
import { DYNAMODB_TABLES } from '../utilities/constants';

const dynamodb = new AWS.DynamoDB();

export async function undoBid(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const data = JSON.parse(event.body);
  const leagueId = data.leagueId;
  const connectionId = event.requestContext.connectionId;
  const itemId = data?.itemId;
  const itemTypeId = data?.itemTypeId;

  try {
    if (itemId == undefined || itemTypeId == undefined) {
      throw new Error('ItemId and ItemTypeId must be provided');
    }

    // verify the leagueId matches the connection
    const verifyResponse = await verifyLeagueConnection(leagueId, connectionId);

    if (verifyResponse === false) {
      throw new Error('ConnectionId and LeagueId do not match');
    }

    const prevBid = await lookupPreviousBid(leagueId);
    console.log(prevBid);

    if (prevBid === false) {
      throw new Error('There is no previous bid');
    }

    const timestamp = new Date().valueOf().toString();

    // undo the bid in a transaction
    const undoBidParams = {
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
                N: String(prevBid.Price)
              },
              ':W': prevBid.UserId === null ?
                { NULL: true } :
                { N: prevBid.UserId },
              ':A': prevBid.Alias === null ?
                { NULL: true } :
                { S: prevBid.Alias },
              ':PBB': {
                N: prevBid.BidId
              },
              ':PB': prevBid.PrevBidId ?
                { N: prevBid.PrevBidId } :
                { NULL: true },
              ':UId': {
                N: String(verifyResponse.UserId)
              },
              ':RId': {
                N: String(verifyResponse.RoleId)
              },
              ':RIdMax': {
                N: '3'
              }
            },
            UpdateExpression: 'SET #TS = :TS, #P = :P, #W = :W, #A = :A, #B = :TS, #PB = :PB',
            ConditionExpression: '(#W = :UId or :RId < :RIdMax) and #PB = :PBB and #S = :S'
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
              UserId: prevBid.UserId === null ?
                { NULL: true } :
                { N: prevBid.UserId },
              Alias: prevBid.Alias === null ?
                { NULL: true } :
                { S: prevBid.Alias },
              Price: {
                N: prevBid.Price
              },
              BidId: {
                N: timestamp
              },
              PrevBidId: prevBid.PrevBidId ?
                { N: prevBid.PrevBidId } :
                { NULL: true },
              Action: {
                S: 'undo'
              }
            }
          }
        }
      ]
    }

    const undoResponse = await dynamodb.transactWriteItems(undoBidParams).promise();

    console.log(undoResponse);
    console.log(undoResponse.ItemCollectionMetrics);

    const auctionObj = {
      Status: 'bidding',
      CurrentItemPrice: prevBid.Price,
      CurrentItemWinner: prevBid.UserId,
      Alias: prevBid.Alias,
      LastBidTimestamp: timestamp
    };

    const payload = {
      msgObj: auctionObj,
      msgType: 'auction_bid'
    };

    await websocketBroadcast(leagueId, payload, event.requestContext.domainName, event.requestContext.stage);

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ message: 'undo bid successful' })
    });
  } catch (error) {
    console.log(error);
    callback(null, {
      statusCode: 500,
      body: JSON.stringify({ message: 'unable to undo bid' })
    });
  }
}