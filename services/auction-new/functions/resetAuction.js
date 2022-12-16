import AWS from 'aws-sdk';
import { DYNAMODB_TABLES, LAMBDAS } from '../utilities/constants';

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

    // if (!responsePayload || !!responsePayload[0]?.Error) {
    //   throw new Error(responsePayload[0].Error);
    // }

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

  console.log(event);
  console.log(leagueId);
  console.log(AWS.VERSION);

  try {
    // delete the auction record in dynamodb
    const deleteAuctionParams = {
      TableName: DYNAMODB_TABLES.AUCTION_TABLE,
      Key: {
        LeagueId: {
          N: String(leagueId)
        }
      }
    }

    console.log(deleteAuctionParams);

    const deleteAuctionResponse = await dynamodb.deleteItem(deleteAuctionParams).promise();
    console.log(deleteAuctionResponse);

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
    console.log(bidHistoryResults);

    const itemsToDelete = [...bidHistoryResults.Items];
    console.log(itemsToDelete);

    let deleteRequests = [];
    let deleteItemCount = 0;

    while (itemsToDelete.length > 0) {
      // can only send 25 delete requests at once
      const item = itemsToDelete.pop();
      console.log(item);

      if (deleteItemCount > 0 && (item == undefined || deleteItemCount >= 25)) {
        const deleteBidHistoryParams = {
          RequestItems: {
            [DYNAMODB_TABLES.BID_HISTORY_TABLE]: deleteRequests
          }
        };
        console.log(deleteBidHistoryParams);
        console.log('delete count: ' + deleteItemCount);
        const deleteResult = await dynamodb.batchWriteItem(deleteBidHistoryParams).promise();
        console.log(deleteResult);
        console.log('itemsToDeleteLength: ' + itemsToDelete.length);
        deleteItemCount = 0;
        deleteRequests = [];
      } else {
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
    }

    callback(null, { message: 'Auction reset successful' });
  } catch (error) {
    console.log(error);
    callback(null, error);
  }
}