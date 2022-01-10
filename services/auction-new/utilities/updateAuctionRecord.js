import AWS from 'aws-sdk';
import { DYNAMODB_TABLES } from './constants';

const dynamodb = new AWS.DynamoDB();

const AUCTION_TABLE = DYNAMODB_TABLES.AUCTION_TABLE;

/**
 * @function updateAuctionRecord
 * @param {Number} leagueId - league's unique identifier
 * @param {Number} teamObj.CurrentItemId - the team's unique identifier
 * @param {Number} teamObj.CurrentItemPrice - current price
 * @param {Number} teamObj.CurrentItemWinner - current winner's unique identifier
 * @param {String} teamObj.Alias - current winner's alias
 * @param {String} teamObj.TeamLogoUrl - Url for the team's logo image
 * @param {Number} teamObj.ItemTypeId - identifies the type of item
 * @param {String} teamObj.ItemName - the name of the team
 * @param {Number} teamObj.Seed - team's seed, if applicable
 * @param {String} teamObj.DisplayName - team's display name, usually follows "({Seed}) {ItemName}"
 * @returns an object containing the values set if successful, null if not successful
 * @description sets the new team values in dynamodb
 */
export async function updateAuctionRecord(leagueId, teamObj) {
  const timestamp = new Date().valueOf().toString();

  const auctionParams = {
    TableName: AUCTION_TABLE,
    ReturnValues: 'ALL_NEW',
    Key: {
      LeagueId: {
        N: String(leagueId)
      }
    },
    ExpressionAttributeNames: {
      '#LId': 'LeagueId',
      '#TS': 'LastBidTimestamp',
      '#S': 'Status',
      '#CId': 'CurrentItemId',
      '#P': 'CurrentItemPrice',
      '#W': 'CurrentItemWinner',
      '#A': 'Alias',
      '#L': 'TeamLogoUrl',
      '#IT': 'ItemTypeId',
      '#N': 'ItemName',
      '#Sd': 'Seed',
      '#DN': 'DisplayName'
    },
    ExpressionAttributeValues: {
      ':LId': {
        N: String(leagueId)
      },
      ':TS': {
        N: timestamp
      },
      ':S': {
        S: 'bidding'
      },
      ':CId': {
        N: String(teamObj.CurrentItemId)
      },
      ':P': {
        N: teamObj.CurrentItemPrice != null ? String(teamObj.CurrentItemPrice) : '0'
      },
      ':W': {
        N: teamObj.CurrentItemWinner != null ? teamObj.CurrentItemWinner : null
      },
      ':A': {
        S: teamObj.Alias != null ? teamObj.Alias : null
      },
      ':L': {
        S: teamObj.TeamLogoUrl
      },
      ':IT': {
        N: String(teamObj.ItemTypeId)
      },
      ':N': {
        S: teamObj.ItemName
      },
      ':Sd': {
        N: String(teamObj.Seed)
      },
      ':DN': {
        S: teamObj.DisplayName
      }
    },
    UpdateExpression: 'SET #LId = :LId, #TS = :TS, #S = :S, #CId = :CId, #P = :P, #W = :W, #A = :A, #L = :L, #IT = :IT, #N = :N, #Sd = :Sd, #DN = :DN'
  }

  try {
    const auctionResponse = await dynamodb.updateItem(auctionParams).promise();
    console.log(auctionResponse);

    const updateData = auctionResponse.Attributes;

    // send the info to all active websocket connections
    const auctionObj = {
      Status: updateData.Status.S,
      CurrentItemId: updateData.CurrentItemId.N,
      TeamLogoUrl: updateData.TeamLogoUrl.S,
      ItemTypeId: updateData.ItemTypeId.N,
      ItemName: updateData.ItemName.S,
      Seed: updateData.Seed.N,
      DisplayName: updateData.DisplayName.S,
      CurrentItemPrice: updateData.CurrentItemPrice.N,
      CurrentItemWinner: updateData.CurrentItemWinner.N,
      Alias: updateData.Alias.S,
      LastBidTimestamp: updateData.LastBidTimestamp.N
    };

    return auctionObj;
  } catch (error) {
    console.log(error);
    return false;
  }
}