import AWS from 'aws-sdk';
import { websocketBroadcast, verifyLeagueConnection, updateAuctionRecord } from '../utilities';
import { LAMBDAS } from '../utilities/constants';

const lambda = new AWS.Lambda();

export async function startAuction(event, context, callback) {
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

    // update the auction status in SQL Server
    const lambdaParams = {
      FunctionName: LAMBDAS.RDS_START_AUCTION,
      LogType: 'Tail',
      Payload: JSON.stringify({ leagueId: leagueId })
    }

    const lambdaResponse = await lambda.invoke(lambdaParams).promise();
    const responsePayload = JSON.parse(lambdaResponse.Payload);
    console.log(responsePayload);
    
    if (!responsePayload.length || !!responsePayload[0]?.Error) {
      throw new Error('Could not set league status')
    }

    const teamObj = responsePayload[0];

    // set the next item in dynamodb
    const auctionObj = await updateAuctionRecord(leagueId, teamObj);

    if (!auctionObj) {
      throw new Error('Error updating auction record');
    }

    const payload = {
      msgObj: auctionObj,
      msgType: 'auction'
    };

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
      body: JSON.stringify({ message: 'error starting auction' })
    });
  }
}