import AWS from 'aws-sdk';
import { websocketBroadcast, verifyLeagueConnection, updateAuctionRecord } from '../utilities';
import { LAMBDAS } from '../utilities/constants';

const lambda = new AWS.Lambda();

export async function getNextItem(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const data = JSON.parse(event.body);
  console.log(data);
  const leagueId = data.leagueId;
  const connectionId = event.requestContext.connectionId;

  try {
    // verify the leagueId matches the connection
    const verifyResponse = await verifyLeagueConnection(leagueId, connectionId);

    if (verifyResponse === false || +verifyResponse.RoleId > 2) {
      throw new Error('User is not allowed to perform this action');
    }

    // get the next item information from RDS
    const lambdaParams = {
      FunctionName: LAMBDAS.RDS_GET_NEXT_ITEM,
      LogType: 'Tail',
      Payload: JSON.stringify({ leagueId: leagueId })
    };

    const lambdaResponse = await lambda.invoke(lambdaParams).promise();
    const responsePayload = JSON.parse(lambdaResponse.Payload);
    console.log(responsePayload);

    if (!responsePayload.length || !!responsePayload[0]?.Error) {
      throw new Error('No available teams');
    }

    const teamObj = responsePayload[0];

    // write that info to dynamodb
    const auctionObj = await updateAuctionRecord(leagueId, teamObj);
    console.log(auctionObj);

    if (!auctionObj) {
      throw new Error('Error updating auction record');
    }

    const payload = {
      msgType: 'auction',
      msgObj: auctionObj
    }

    // send the info to all active websocket connections
    await websocketBroadcast(leagueId, payload, event.requestContext.domainName, event.requestContext.stage);

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ message: 'next team set' })
    });
  } catch (error) {
    console.log(error);
    callback(null, {
      statusCode: 500,
      body: JSON.stringify({ message: 'error getting next team' })
    });
  }
}