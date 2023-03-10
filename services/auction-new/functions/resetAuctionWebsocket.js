import AWS from 'aws-sdk';
import { verifyLeagueConnection, websocketBroadcast, websocketBroadcastToConnection } from '../utilities';
import { LAMBDAS } from '../utilities/constants';

const lambda = new AWS.Lambda();

export async function resetAuctionWebsocket(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const data = JSON.parse(event.body);
  const { leagueId } = data;
  const connectionId = event.requestContext.connectionId;

  try {
    const verifyResponse = await verifyLeagueConnection(leagueId, connectionId);

    if (verifyResponse === false || +verifyResponse.RoleId > 2) {
      throw new Error('User is not allowed to perform this action');
    }

    const cognitoSub = verifyResponse.CognitoSub;

    const lambdaParams = {
      FunctionName: LAMBDAS.RDS_RESET_AUCTION,
      LogType: 'Tail',
      Payload: JSON.stringify({ leagueId: leagueId, cognitoSub: cognitoSub })
    };

    const lambdaResponse = await lambda.invoke(lambdaParams).promise();
    const responsePayload = JSON.parse(lambdaResponse.Payload);

    console.log(responsePayload);

    const dynamodbLambdaParams = {
      FunctionName: LAMBDAS.DYNAMODB_RESET_AUCTION,
      LogType: 'Tail',
      Payload: JSON.stringify({ leagueId: leagueId })
    }

    const dynamodbLambdaResponse = await lambda.invoke(dynamodbLambdaParams).promise();
    console.log(dynamodbLambdaResponse);

    const msgObj = {
      action: 'RESET_AUCTION',
      notifLevel: 'info',
      notifMessage: `${verifyResponse.Alias} reset all auction data`,
      refreshData: true,
      data: null
    };

    const websocketPayload = {
      msgObj: msgObj,
      msgType: 'auction_info'
    }

    await websocketBroadcast(leagueId, websocketPayload, event.requestContext.domainName, event.requestContext.stage);

    // get a full data update
    lambdaParams.FunctionName = LAMBDAS.RDS_GET_UPDATED_AUCTION_DATA;
    lambdaParams.Payload = JSON.stringify({ leagueId: leagueId });

    const updatedData = await lambda.invoke(lambdaParams).promise();
    console.log(updatedData);

    const syncData = JSON.parse(updatedData.Payload);
    console.log(syncData);

    const dataSyncPayload = {
      msgObj: syncData,
      msgType: 'auction_sync'
    };

    await websocketBroadcast(leagueId, dataSyncPayload, event.requestContext.domainName, event.requestContext.stage);

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ message: 'auction reset' })
    });
  } catch (error) {
    console.log(error);

    const endpoint = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
    const payload = {
      msgType: 'auction_error',
      message: 'Unable to reset auction'
    };
    await websocketBroadcastToConnection(endpoint, connectionId, payload);

    callback(null, {
      statusCode: 500,
      body: JSON.stringify({ message: 'unable to reset auction' })
    });
  }
}