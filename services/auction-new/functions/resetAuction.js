import AWS from 'aws-sdk';
import { DYNAMODB_TABLES, DYNAMODB_INDEXES, LAMBDAS } from '../utilities/constants';
import { auctionPayload } from './common/payload';
import { websocketBroadcastAll } from '../utilities/websocketBroadcast';

const lambda = new AWS.Lambda();
const dynamodb = new AWS.DynamoDB();

export async function resetAuction(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const cognitoSub = event.cognitoPoolClaims.sub;
  const leagueId = event.path.leagueId;

  try {
    const lambdaParams = {
      FunctionName: LAMBDAS.RDS_RESET_AUCTION,
      LogType: 'Tail',
      Payload: JSON.stringify({ leagueId: leagueId, cognitoSub: cognitoSub })
    }

    // reset all auction data in SQL Server
    const lambdaResponse = await lambda.invoke(lambdaParams).promise();
    const responsePayload = JSON.parse(lambdaResponse.Payload);

    console.log(responsePayload);

    if (!responsePayload || !!responsePayload[0]?.Error) {
      throw new Error(responsePayload[0].Error);
    }

    // reset all data in dynamodb (except for the chat)
    const dynamodbLambdaParams = {
      FunctionName: LAMBDAS.DYNAMODB_RESET_AUCTION,
      LogType: 'Tail',
      Payload: JSON.stringify({ leagueId: leagueId })
    };

    const dynamodbLambdaResponse = await lambda.invoke(dynamodbLambdaParams).promise();
    console.log(dynamodbLambdaResponse);

    callback(null, { message: 'Auction reset successful' });
  } catch (error) {
    console.log(error);
    callback(null, { error: 'Auction reset failed'});
  }
}

export async function dynamodbResetAuction(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const { leagueId } = event;

  try {
    const verifyResponse = await verifyLeagueConnection(leagueId, connectionId);

    if (verifyResponse === false || +verifyResponse.RoleId > 2) {
      throw new Error('User is not allowed to perform this action');
    }

    // delete the auction record in dynamodb
    const deleteAuctionParams = {
      TableName: DYNAMODB_TABLES.AUCTION_TABLE,
      Key: {
        LeagueId: {
          N: String(leagueId)
        }
      }
    }

    const deleteAuctionResponse = await dynamodb.deleteItem(deleteAuctionParams).promise();
    console.log(deleteAuctionResponse);

    await deleteBidHistory(leagueId);
    await deleteAuctionLedger(leagueId);

    // broadcast updated data to all users in the auction room (if any)
    if (await checkConnectedUsers(leagueId)) {
      const payload = await auctionPayload(leagueId, 'FULL');
      payload.message = `${verifyResponse.Alias} reset all auction data`;

      const websocketPayload = {
        msgObj: payload,
        msgType: 'auction_reset'
      };

      const endpoint = `https://${process.env.WEBSOCKET_ENDPOINT}`;
      await websocketBroadcastAll(leagueId, websocketPayload, endpoint);
    }

    callback(null, { message: 'Auction reset successful' });
  } catch (error) {
    console.log(error);
    callback(null, error);
  }
}

async function deleteBidHistory(leagueId) {
  // query dynamodb for all bid history records, then delete them
  const bidHistoryQuery = {
    TableName: DYNAMODB_TABLES.BID_HISTORY_TABLE,
    ExpressionAttributeValues: {
      ':v1': {
        N: String(leagueId)
      }
    },
    KeyConditionExpression: 'LeagueId = :v1',
    ProjectionExpression: 'LeagueId, BidId'
  };

  const bidHistoryResults = await dynamodb.query(bidHistoryQuery).promise();

  const itemsToDelete = [...bidHistoryResults.Items];

  const deleteRequests = [];
  let deleteItemCount = 0;

  while (itemsToDelete.length > 0) {
    // can only send 25 delete requests at once
    const item = itemsToDelete.pop();

    if (item != undefined) {
      deleteRequests.push({
        DeleteRequest: {
          Key: {
            'LeagueId': {
              N: item.LeagueId.N
            },
            'BidId': {
              N: item.BidId.N
            }
          }
        }
      });

      deleteItemCount++;
    }

    if (deleteItemCount > 0 && (itemsToDelete.length == 0 || deleteItemCount >= 25)) {
      const deleteBidHistoryParams = {
        RequestItems: {
          [DYNAMODB_TABLES.BID_HISTORY_TABLE]: deleteRequests
        }
      };

      const deleteResult = await dynamodb.batchWriteItem(deleteBidHistoryParams).promise();
      console.log(deleteResult);

      deleteItemCount = 0;
      deleteRequests = [];
    }
  }
}

async function deleteAuctionLedger(leagueId) {
  const ledgerQuery = {
    TableName: DYNAMODB_TABLES.AUCTION_LEDGER_TABLE,
    ExpressionAttributeValues: {
      ':v1': {
        N: String(leagueId)
      }
    },
    KeyConditionExpression: 'LeagueId = :v1',
    ProjectionExpression: 'LeagueId, LedgerId'
  };

  const ledgerItems = await dynamodb.query(ledgerQuery).promise();
  const itemsToDelete = [...ledgerItems.Items];

  const deleteRequests = [];
  let deleteItemCount = 0;

  while (itemsToDelete.length > 0) {
    // can only send 25 delete requests at once
    const item = itemsToDelete.pop();

    if (item != undefined) {
      deleteRequests.push({
        DeleteRequest: {
          Key: {
            'LeagueId': {
              N: item.LeagueId.N
            },
            'LedgerId': {
              N: item.LedgerId.N
            }
          }
        }
      });

      deleteItemCount++;
    }

    if (deleteItemCount > 0 && (itemsToDelete.length == 0 || deleteItemCount >= 25)) {
      const deleteLedgerParams = {
        RequestItems: {
          [DYNAMODB_TABLES.AUCTION_LEDGER_TABLE]: deleteRequests
        }
      };

      const deleteResult = await dynamodb.batchWriteItem(deleteLedgerParams).promise();
      console.log(deleteResult);

      deleteItemCount = 0;
      deleteRequests = [];
    }
  }
}

async function checkConnectedUsers(leagueId) {
  const queryParams = {
    TableName: DYNAMODB_TABLES.CONNECTION_TABLE,
    IndexName: DYNAMODB_INDEXES.CONNECTION_INDEX,
    ExpressionAttributeValues: {
      ':v1': {
        N: String(leagueId)
      }
    },
    KeyConditionExpression: 'LeagueId = :v1',
    ProjectionExpression: 'ConnectionId'
  };

  const result = await dynamodb.query(queryParams).promise();

  const connectionIds = result.Items.map((connection) => {
    return connection.ConnectionId.S
  });

  return connectionIds.length > 0;
}