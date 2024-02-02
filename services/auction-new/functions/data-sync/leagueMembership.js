import AWS from 'aws-sdk';
import { DYNAMODB_TABLES } from '../../utilities/constants';
import { websocketBroadcastAll } from '../../utilities/websocketBroadcast';

const LEAGUE_MEMBERSHIP_TABLE = DYNAMODB_TABLES.LEAGUE_MEMBERSHIP_TABLE;

const dynamodb = new AWS.DynamoDB();
// const lambda = new AWS.Lambda();

/**
 * Invoked by lambdas in other parts of the app to ensure dynamodb stays
 * in sync with SQL Server.
 * 
 * We update dynamodb with data passed into this function, then broadcast
 * the updated data to all connected websocket clients
 */
export async function syncLeagueMembership(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const { leagueId, leagueMemberships } = event;

  try {
    const dynamodbParams = buildDynamoDbParams(leagueId, leagueMemberships);
    console.log(dynamodbParams);

    const updateResponse = await dynamodb.updateItem(dynamodbParams).promise();
    console.log(updateResponse);

    const updateData = updateResponse.Attributes;
    console.log(updateData);

    const payload = {
      msgObj: leagueMemberships,
      msgType: 'auction_league_memberships'
    };

    const endpoint = `https://${process.env.WEBSOCKET_ENDPOINT}`;
    await websocketBroadcastAll(leagueId, payload, endpoint);

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ message: 'league membership synced' })
    });
  } catch (error) {
    console.log(error);

    callback(null, {
      statusCode: 500,
      body: JSON.stringify({ message: 'error syncing league membership' })
    });
  }
}

/**
 * @typedef LeagueMembership
 * @property {Number} LeagueMembershipId
 * @property {Number} UserId
 * @property {String} Alias
 * @property {Number} RoleId
 * @property {String} RoleName
 */

/**
 * @function
 * @param {Number} leagueId 
 * @param {Array<LeagueMembership>} leagueMemberships 
 */
function buildDynamoDbParams(leagueId, leagueMemberships) {
  if (leagueMemberships?.length == 0) throw new Error('League membership list is empty');

  const parsedLeagueMemberships = constructLeagueMembershipList(leagueMemberships);

  const dynamoDbParams = {
    TableName: LEAGUE_MEMBERSHIP_TABLE,
    ReturnValues: 'ALL_NEW',
    Key: {
      LeagueId: {
        N: String(leagueId)
      }
    },
    ExpressionAttributeNames: {
      '#LM': 'LeagueMemberships'
    },
    ExpressionAttributeValues: {
      ':LM': {
        L: parsedLeagueMemberships
      }
    },
    UpdateExpression: 'SET #LM = :LM'
  };

  return dynamoDbParams;
}

/**
 * @function
 * @param {Array<LeagueMembership>} leagueMemberships
 */
function constructLeagueMembershipList(leagueMemberships) {
  return leagueMemberships.map(m => {
    return {
      M: {
        leaguemembershipId: {
          N: String(m.LeagueMembershipId)
        },
        userId: {
          N: String(m.UserId)
        },
        alias: {
          S: m.Alias
        },
        roleId: {
          N: String(m.RoleId)
        },
        roleName: {
          S: m.RoleName
        }
      }
    };
  });
}

/*
LeagueMembership dynamodb fields

LeagueId
LeagueMemberships: [
  LeagueMembershipId - unique identifier
  UserId
  Alias
  RoleId
  RoleName
  IsAuctioneer - available if I get around to this functionality
]
AuctioneerUserId - not synchronized by this process
*/