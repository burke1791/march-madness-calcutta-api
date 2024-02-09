import AWS from 'aws-sdk';
import { DYNAMODB_TABLES } from '../../utilities/constants';
import { websocketBroadcastAll } from '../../utilities/websocketBroadcast';
import { parseAuctionResults } from '../../utilities/parseAuctionResults';

const AUCTION_RESULTS_TABLE = DYNAMODB_TABLES.AUCTION_RESULTS_TABLE;

const dynamodb = new AWS.DynamoDB();

export async function syncAuctionResults(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const { leagueId, data } = event;

  try {
    const dynamodbParams = buildDynamoDbParams(leagueId, data);
    console.log(dynamodbParams);

    const updateResponse = await dynamodb.updateItem(dynamodbParams).promise();
    console.log(updateResponse);

    const updateData = updateResponse.Attributes;
    console.log(updateData);

    const auctionResults = parseAuctionResults(updateData);

    const payload = {
      msgObj: auctionResults,
      msgType: `auction_results`
    };

    const endpoint = `https://${process.env.WEBSOCKET_ENDPOINT}`;
    await websocketBroadcastAll(leagueId, payload, endpoint);

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ message: 'auction results synced' })
    });
  } catch (error) {
    console.log(error);
    callback(null, {
      statusCode: 500,
      body: JSON.stringify({ message: 'error syncing auction results' })
    });
  }
}

function buildDynamoDbParams(leagueId, data) {
  const parsedAuctionResults = constructAuctionResultsList(data);

  const dynamoDbParams = {
    TableName: AUCTION_RESULTS_TABLE,
    ReturnValues: 'ALL_NEW',
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
        L: parsedAuctionResults
      }
    },
    UpdateExpression: 'SET #AR = :AR'
  };

  return dynamoDbParams;
}

function constructAuctionResultsList(data) {
  if (!Array.isArray(data)) return [];

  return data.map(d => {
    return {
      M: {
        itemId: {
          N: String(d.ItemId)
        },
        itemTypeId: {
          N: String(d.ItemTypeId)
        },
        userId: {
          N: String(d.UserId)
        },
        alias: {
          S: d.Alias
        },
        price: {
          N: String(d.Price)
        }
      }
    };
  });
}

