import AWS from 'aws-sdk';
import { DYNAMODB_TABLES } from '../../utilities/constants';

const AUCTION_RESULTS_TABLE = DYNAMODB_TABLES.AUCTION_RESULTS_TABLE;

const dynamodb = new AWS.DynamoDB();

export async function syncAuctionSlots(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const { leagueId, data } = event;

  try {
    const dynamodbParams = buildDynamoDbParams(leagueId, data);
    console.log(dynamodbParams);

    const updateResponse = await dynamodb.updateItem(dynamodbParams).promise();
    console.log(updateResponse);

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
  if (data?.length == 0) throw new Error('Auction slots list is empty');

  const parsedAuctionSlots = constructAuctionSlotList(data);

  const dynamoDbParams = {
    TableName: AUCTION_RESULTS_TABLE,
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