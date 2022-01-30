import AWS from 'aws-sdk';
import { DYNAMODB_TABLES } from './constants';

const dynamodb = new AWS.DynamoDB();

const AUCTION_TABLE = DYNAMODB_TABLES.AUCTION_TABLE;

/**
 * @function getAuctionItem
 * @param {Number} leagueId - league's unique identifier 
 * @param {String} attributesToGet - comma-separated list of fields to retrieve from the dynamodb table
 * @returns an object containing the values for the provided "attributesToGet"
 */
export async function getAuctionItem(leagueId, attributesToGet) {
  const auctionParams = {
    TableName: AUCTION_TABLE,
    Key: {
      LeagueId: {
        N: String(leagueId)
      }
    },
    ProjectionExpression: !!attributesToGet ? attributesToGet : ''
  };

  try {
    const auctionResponse = await dynamodb.getItem(auctionParams).promise();

    return auctionResponse.Item;
  } catch(error) {
    console.log(error);
    return false;
  }
}