import AWS from 'aws-sdk';
import { DYNAMODB_TABLES } from '../../utilities/constants';
import { websocketBroadcastAll } from '../../utilities/websocketBroadcast';
import { parseAuctionResults } from '../../utilities/parseAuctionResults';

const AUCTION_SETTINGS_TABLE = DYNAMODB_TABLES.AUCTION_SETTINGS_TABLE;

const dynamodb = new AWS.DynamoDB();

export async function syncAuctionSlots(event, context, callback) {
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
      body: JSON.stringify({ message: 'auction slots synced' })
    });
  } catch (error) {
    console.log(error);
    callback(null, {
      statusCode: 500,
      body: JSON.stringify({ message: 'error syncing auction slots' })
    });
  }
}

function buildDynamoDbParams(leagueId, data) {
  const parsedAuctionSlots = constructAuctionSlotList(data);

  const dynamoDbParams = {
    TableName: AUCTION_SETTINGS_TABLE,
    ReturnValues: 'ALL_NEW',
    Key: {
      LeagueId: {
        N: String(leagueId)
      }
    },
    ExpressionAttributeNames: {
      '#AS': 'AuctionSlots'
    },
    ExpressionAttributeValues: {
      ':AS': {
        L: parsedAuctionSlots
      }
    },
    UpdateExpression: 'SET #AS = :AS'
  };

  return dynamoDbParams;
}

function constructAuctionSlotList(data) {
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
        teamLogoUrl: d.TeamLogoUrl != null ?
          { S: d.TeamLogoUrl } :
          { NULL: true },
        itemTypeName: {
          S: d.ItemTypeName
        },
        seed: d.Seed != null ?
          { N: String(d.Seed) } :
          { NULL: true },
        itemName: {
          S: d.ItemName
        },
        displayName: {
          S: d.DisplayName
        },
        isComplete: {
          BOOL: d.IsComplete
        }
      }
    };
  });
}