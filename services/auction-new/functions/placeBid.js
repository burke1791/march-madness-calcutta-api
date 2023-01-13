import AWS from 'aws-sdk';
import { verifyLeagueConnection, websocketBroadcast, websocketBroadcastToConnection } from '../utilities';
import { DYNAMODB_TABLES, LAMBDAS } from '../utilities/constants';

const dynamodb = new AWS.DynamoDB();
const lambda = new AWS.Lambda();

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

    const userId = verifyResponse.UserId;
    const alias = verifyResponse.Alias;

    const bidValidation = await verifyBid(leagueId, userId, amount);

    if (!bidValidation.isValid) {
      throw new Error(bidValidation.errorMessage);
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
                N: userId
              },
              ':A': {
                S: alias
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
                N: userId
              },
              Alias: {
                S: alias
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
      CurrentItemWinner: userId,
      Alias: alias,
      LastBidTimestamp: timestamp
    }

    const payload = {
      msgObj: auctionObj,
      msgType: 'auction_bid'
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

/**
 * @typedef verifyBidReturn
 * @property {Boolean} isValid - whether or not the bid passes validation
 * @property {String} errorMessage - error text explaining why the bid did not pass validation
 */

/**
 * @function verifyBid
 * @param {Number} leagueId - leagueId (league primary key in SQL Server)
 * @param {Number} userId - userId (user primary key in SQL Server)
 * @param {Number} bidAmount - the proposed bid amount
 * @returns {verifyBidReturn}
 * @description verifies whether or not the proposed bid by the user is valid
 */
async function verifyBid(leagueId, userId, bidAmount) {
  const payload = {
    leagueId: leagueId,
    userId: userId,
    bidAmount: bidAmount
  };

  const lambdaParams = {
    FunctionName: LAMBDAS.RDS_VERIFY_BID,
    LogType: 'Tail',
    Payload: JSON.stringify(payload)
  }

  const lambdaResponse = await lambda.invoke(lambdaParams).promise();

  console.log(lambdaResponse);

  const responsePayload = JSON.parse(lambdaResponse.Payload);
  console.log(responsePayload);

  return {
    isValid: responsePayload.IsValid,
    errorMessage: responsePayload.ValidationMessage
  };
}