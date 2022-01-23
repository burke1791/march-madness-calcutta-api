import AWS from 'aws-sdk';
import { verifyLeagueConnection } from '../utilities';
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
              '#A': 'Alias'
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
              }
            },
            UpdateExpression: 'SET #TS = :TS, #P = :P, #W = :W, #A = :A',
            ConditionExpression: ':P > #P and #S = :S'
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
              Price: {
                N: String(amount)
              }
            }
          }
        }
      ]
    }

    const bidResponse = await dynamodb.transactWriteItems(bidParams).promise();

    console.log(bidResponse);
    console.log(bidResponse.ItemCollectionMetrics);

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ message: 'bid accepted' })
    });
  } catch (error) {
    console.log(error);
    callback(null, {
      statusCode: 500,
      body: JSON.stringify({ message: 'bid not accepted' })
    });
  }
}