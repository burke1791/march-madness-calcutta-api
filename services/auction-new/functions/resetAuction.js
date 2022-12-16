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

  try {
    // delete the auction record in dynamodb
    const deleteAuctionParams = {
      TableName: DYNAMODB_TABLES.AUCTION_TABLE,
      Key: {
        LeagueId: {
          N: '262' // String(leagueId)
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

    callback(null, { message: 'Auction reset successful' });
  } catch (error) {
    console.log(error);
    callback(null, error);
  }
}