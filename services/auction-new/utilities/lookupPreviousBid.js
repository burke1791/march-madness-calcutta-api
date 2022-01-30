import AWS from 'aws-sdk';
import { DYNAMODB_TABLES } from './constants';

const dynamodb = new AWS.DynamoDB();

const AUCTION_TABLE = DYNAMODB_TABLES.AUCTION_TABLE;
const BID_HISTORY_TABLE = DYNAMODB_TABLES.BID_HISTORY_TABLE;

/**
 * @function lookupPreviousBid
 * @param {Number} leagueId - league's unique identifier
 * @returns an object containing the previous bid values
 */
export async function lookupPreviousBid(leagueId) {
  
  try {
    const currentBidParams = {
      TableName: AUCTION_TABLE,
      Key: {
        LeagueId: {
          N: String(leagueId)
        }
      },
      ProjectionExpression: 'PrevBidTimestamp'
    }

    const currentBidResponse = await dynamodb.getItem(currentBidParams).promise();
    console.log(currentBidResponse);

    const prevBidTimestamp = currentBidResponse.Item.PrevBidTimestamp.N;

    if (prevBidTimestamp === '0') {
      throw new Error('There is no previous bid');
    }

    const prevBidParams = {
      TableName: BID_HISTORY_TABLE,
      Key: {
        LeagueId: {
          N: String(leagueId)
        },
        BidTimestamp: {
          N: prevBidTimestamp
        }
      },
      ProjectionExpression: 'BidTimestamp, ItemId, ItemTypeId, Price, UserId, Alias, BidId, PrevBidId'
    };

    const prevBidResponse = await dynamodb.getItem(prevBidParams).promise();
    console.log(prevBidResponse);

    return {
      BidTimestamp: prevBidResponse.Item.BidTimestamp.N,
      ItemId: prevBidResponse.Item.ItemId.N,
      ItemTypeId: prevBidResponse.Item.ItemTypeId.N,
      Price: prevBidResponse.Item.Price.N,
      UserId: prevBidResponse.Item.UserId.N,
      Alias: prevBidResponse.Item.Alias.S,
      BidId: prevBidResponse.Item.BidId.N,
      PrevBidId: prevBidResponse.Item.PrevBidId.N
    };
  } catch (error) {
    console.log(error);
    return false;
  }
}