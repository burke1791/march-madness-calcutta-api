import AWS from 'aws-sdk';
import { websocketBroadcast, verifyLeagueConnection, updateAuctionRecord } from '../utilities';

const lambda = new AWS.Lambda();

const LAMBDAS = {
  RDS_START_AUCTION: `calcutta-auction-service-v2-${process.env.APP_ENV}-rdsStartAuction`
};

export async function startAuction(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const data = JSON.parse(event.body);
  console.log(data);
  const leagueId = data.leagueId;
  const connectionId = event.requestContext.connectionId;

  try {
    // verify the leagueId matches the connection
    if (!await verifyLeagueConnection(leagueId, connectionId)) {
      throw new Error('ConnectionId and LeagueId do not match');
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
    console.log(auctionObj);

    if (!auctionObj) {
      throw new Error('Error updating auction record');
    }

    // send the info to all active websocket connections
    await websocketBroadcast(leagueId, auctionObj, event.requestContext.domainName, event.requestContext.stage);

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