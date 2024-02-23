import AWS from 'aws-sdk';
import { DYNAMODB_TABLES } from "../../utilities/constants";
import { parseAuctionSettings } from '../../utilities/parseAuctionSettings';

const dynamodb = new AWS.DynamoDB();

/**
 * @typedef AuctionSettings
 * @property {Array} [settings]
 * @property {Array} [slots]
 * @property {Array} [bidRules]
 * @property {Array} [taxRules]
 */

/**
 * @function
 * @param {Number} leagueId 
 * @param {String} projectionExpression
 * @returns {AuctionSettings}
 */
export async function getAuctionSettings(leagueId, projectionExpression) {
  const params = {
    TableName: DYNAMODB_TABLES.AUCTION_SETTINGS_TABLE,
    Key: {
      LeagueId: {
        N: String(leagueId)
      }
    },
    ProjectionExpression: projectionExpression
  };

  const data = await dynamodb.getItem(params).promise();

  return parseAuctionSettings(data.Item);
}
