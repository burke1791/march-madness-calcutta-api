import AWS from 'aws-sdk';
import { verifyLeagueConnection, websocketBroadcast, websocketBroadcastToConnection } from '../utilities';
import { LAMBDAS } from "../utilities/constants";

const lambda = new AWS.Lambda();

export async function resetAuctionItem(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const data = JSON.parse(event.body);
  const { leagueId, itemId, itemTypeId } = data;
  const connectionId = event.requestContext.connectionId;

  try {
    const verifyResponse = await verifyLeagueConnection(leagueId, connectionId);

    if (verifyResponse === false || +verifyResponse.RoleId > 2) {
      throw new Error('User is not allowed to perform this action');
    }

    const lambdaPayload = {
      leagueId: leagueId,
      itemId: itemId,
      itemTypeId: itemTypeId
    };

    const lambdaParams = {
      FunctionName: LAMBDAS.RDS_RESET_ITEM,
      LogType: 'Tail',
      Payload: JSON.stringify(lambdaPayload)
    }

    const lambdaResponse = await lambda.invoke(lambdaParams).promise();
    console.log(lambdaResponse);

    const resetResponse = JSON.parse(lambdaResponse.Payload);

    const msgObj = {
      action: 'RESET_ITEM',
      notifLevel: 'info',
      notifMessage: `${verifyResponse.Alias} reset ${resetResponse.DisplayName}`,
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
      body: JSON.stringify({ message: 'item reset' })
    });
  } catch (error) {
    console.log(error);

    const endpoint = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
    const payload = {
      msgType: 'auction_error',
      message: 'Unable to reset item'
    };
    await websocketBroadcastToConnection(endpoint, connectionId, payload);

    callback(null, {
      statusCode: 500,
      body: JSON.stringify({ message: 'unable to reset item' })
    });
  }
}