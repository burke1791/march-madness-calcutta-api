import AWS from 'aws-sdk';
import { AUCTION_STATUS, DYNAMODB_TABLES } from './constants';
import { parseAuctionStatus } from '../functions/common/auctionStatus';

const dynamodb = new AWS.DynamoDB();

const AUCTION_TABLE = DYNAMODB_TABLES.AUCTION_TABLE;
const BID_HISTORY_TABLE = DYNAMODB_TABLES.BID_HISTORY_TABLE;

/**
 * @function setNewAuctionTeam
 * @param {Number} leagueId - league's unique identifier
 * @param {Number} teamObj.itemId - the team's unique identifier
 * @param {String} teamObj.teamLogoUrl - Url for the team's logo image
 * @param {Number} teamObj.itemTypeId - identifies the type of item
 * @param {String} teamObj.itemName - the name of the team
 * @param {Number} teamObj.seed - team's seed, if applicable
 * @param {String} teamObj.displayName - team's display name, usually follows "({Seed}) {ItemName}"
 * @returns an object containing the values set if successful, null if not successful
 * @description sets the new team values in dynamodb
 */
export async function setNewAuctionTeam(leagueId, teamObj) {
  const timestamp = new Date().valueOf().toString();

  const auctionParams = {
    ReturnItemCollectionMetrics: 'SIZE',
    TransactItems: [
      {
        Update: {
          TableName: AUCTION_TABLE,
          Key: {
            LeagueId: {
              N: String(leagueId)
            }
          },
          ExpressionAttributeNames: {
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
            '#DN': 'DisplayName',
            '#B': 'BidId',
            '#PB': 'PrevBidId'
          },
          ExpressionAttributeValues: {
            ':TS': {
              N: timestamp
            },
            ':S': {
              S: AUCTION_STATUS.BIDDING
            },
            ':S_I': {
              S: AUCTION_STATUS.INITIAL
            },
            ':S_CS': {
              S: AUCTION_STATUS.CONFIRMED_SOLD
            },
            ':S_E': {
              S: AUCTION_STATUS.END
            },
            ':CId': {
              N: String(teamObj.itemId)
            },
            ':P': {
              N: '0'
            },
            ':W': { NULL: true },
            ':A': { NULL: true },
            ':L': teamObj.teamLogoUrl != null ?
              { S: teamObj.teamLogoUrl } :
              { NULL: true },
            ':IT': {
              N: String(teamObj.itemTypeId)
            },
            ':N': {
              S: teamObj.itemName
            },
            ':Sd': teamObj.seed != null ?
              { N: String(teamObj.seed) } :
              { NULL: true },
            ':DN': {
              S: teamObj.displayName
            },
            ':B': {
              N: timestamp // using timestamp instead of uuid because I want it to be useful in RANGE queries against the BidHistory table
            },
            ':PB': {
              NULL: true
            }
          },
          UpdateExpression: 'SET #TS = :TS, #S = :S, #CId = :CId, #P = :P, #W = :W, #A = :A, #L = :L, #IT = :IT, #N = :N, #Sd = :Sd, #DN = :DN, #B = :B, #PB = :PB',
          ConditionExpression: 'attribute_not_exists(#S) or #S = :S_I or #S = :S_CS or #S = :S_E'
        }
      },
      {
        Put: {
          TableName: BID_HISTORY_TABLE,
          Item: {
            LeagueId: {
              N: String(leagueId)
            },
            BidTimestamp: {
              N: timestamp
            },
            ItemId: {
              N: String(teamObj.itemId)
            },
            ItemTypeId: {
              N: String(teamObj.itemTypeId)
            },
            UserId: { NULL: true },
            Alias: { NULL: true },
            Price: {
              N: '0'
            },
            BidId: {
              N: timestamp
            },
            PrevBidId: {
              N: '0'
            },
            Action: {
              S: 'open'
            }
          }
        }
      }
    ]
  }

  try {
    const auctionResponse = await dynamodb.transactWriteItems(auctionParams).promise();

    console.log(auctionResponse);

    // send the info to all active websocket connections
    const auctionObj = {
      Status: 'bidding',
      CurrentItemId: teamObj.itemId,
      TeamLogoUrl: teamObj.teamLogoUrl,
      ItemTypeId: teamObj.itemTypeId,
      ItemName: teamObj.itemName,
      Seed: teamObj.seed,
      DisplayName: teamObj.displayName,
      CurrentItemPrice: 0,
      CurrentItemWinner: null,
      Alias: null,
      LastBidTimestamp: timestamp
    };

    return auctionObj;
  } catch (error) {
    console.log(error);
    return false;
  }
}

export async function resetAuctionClock(leagueId) {
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
      '#TS': 'LastBidTimestamp',
      '#S': 'Status'
    },
    ExpressionAttributeValues: {
      ':TS': {
        N: timestamp
      },
      ':S': {
        S: 'bidding'
      }
    },
    UpdateExpression: 'SET #TS = :TS, #S = :S'
  }

  try {
    const auctionResponse = await dynamodb.updateItem(auctionParams).promise();

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

export async function closeDynamoDbAuction(leagueId) {
  const auctionParams = {
    TableName: AUCTION_TABLE,
    ReturnValues: 'ALL_NEW',
    Key: {
      LeagueId: {
        N: String(leagueId)
      }
    },
    ExpressionAttributeNames: {
      '#S': 'Status'
    },
    ExpressionAttributeValues: {
      ':S': {
        S: AUCTION_STATUS.END
      }
    },
    UpdateExpression: 'SET #S = :S'
  }

  try {
    const status = await dynamodb.updateItem(auctionParams).promise();

    return parseAuctionStatus(status.Attributes);
  } catch (error) {
    console.log(error);
    return false;
  }
}

export async function reopenDynamoDbAuction(leagueId) {
  const auctionParams = {
    TableName: AUCTION_TABLE,
    ReturnValues: 'ALL_NEW',
    Key: {
      LeagueId: {
        N: String(leagueId)
      }
    },
    ExpressionAttributeNames: {
      '#S': 'Status'
    },
    ExpressionAttributeValues: {
      ':S': {
        S: AUCTION_STATUS.CONFIRMED_SOLD
      }
    },
    UpdateExpression: 'SET #S = :S'
  }

  try {
    const status = await dynamodb.updateItem(auctionParams).promise();

    return parseAuctionStatus(status.Attributes);
  } catch (error) {
    console.log(error);
    return false;
  }
}