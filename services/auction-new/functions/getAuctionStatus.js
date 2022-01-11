import AWS from 'aws-sdk';
import { DYNAMODB_INDEXES, DYNAMODB_TABLES } from '../utilities/constants';

const dynamodb = new AWS.DynamoDB();

const CONNECTION_TABLE = DYNAMODB_TABLES.CONNECTION_TABLE;
const CONNECTION_INDEX = DYNAMODB_INDEXES.CONNECTION_INDEX;
const AUCTION_TABLE = DYNAMODB_TABLES.AUCTION_TABLE;

export async function getAuctionStatus(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const cognitoSub = event.cognitoPoolClaims.sub;
  const leagueId = event.path.leagueId;

  try {
    const connectionParams = {
      TableName: CONNECTION_TABLE,
      IndexName: CONNECTION_INDEX,
      ExpressionAttributeValues: {
        ':v1': {
          N: leagueId
        },
        ':v2': {
          S: cognitoSub
        }
      },
      KeyConditionExpression: 'LeagueId = :v1 AND CognitoSub = :v2',
      ProjectionExpression: 'Alias'
    };

    const connectionResponse = await dynamodb.query(connectionParams).promise();

    if (!connectionResponse.Items.length) {
      throw new Error('Could not find a matching registered user');
    }

    const auctionParams = {
      TableName: AUCTION_TABLE,
      Key: {
        LeagueId: {
          N: String(leagueId)
        }
      }
    }

    const auctionResponse = await dynamodb.getItem(auctionParams).promise();
    console.log(auctionResponse);

    let auctionObj;

    if (!auctionResponse.Item) {
      // auction record does not exist, send default "initial" auction values
      auctionObj = {
        Status: 'initial',
        CurrentItemId: null,
        TeamLogoUrl: null,
        ItemTypeId: null,
        ItemName: null,
        Seed: null,
        DisplayName: null,
        CurrentItemPrice: 0,
        CurrentItemWinner: null,
        Alias: null,
        LastBidTimestamp: null
      }
    } else {
      auctionObj = {
        Status: auctionResponse.Item.Status.S,
        CurrentItemId: auctionResponse.Item.CurrentItemId.N,
        TeamLogoUrl: auctionResponse.Item.TeamLogoUrl.S,
        ItemTypeId: auctionResponse.Item.ItemTypeId.N,
        ItemName: auctionResponse.Item.ItemName.S,
        Seed: auctionResponse.Item.Seed.N,
        DisplayName: auctionResponse.Item.DisplayName.S,
        CurrentItemPrice: auctionResponse.Item.CurrentItemPrice.N,
        CurrentItemWinner: auctionResponse.Item.CurrentItemWinner.N,
        Alias: auctionResponse.Item.Alias.S,
        LastBidTimestamp: auctionResponse.Item.LastBidTimestamp.N
      }
    }

    callback(null, [auctionObj]);
  } catch (error) {
    console.log(error);
    callback(null, error);
  }
}