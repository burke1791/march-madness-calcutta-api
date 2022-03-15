import AWS from 'aws-sdk';
import { verifyLeagueConnection, websocketBroadcastToConnection, closeDynamoDbAuction } from '../utilities';
import { LAMBDAS } from '../utilities/constants';

const lambda = new AWS.Lambda();

export async function closeAuction(event, context, callback) {
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
      FunctionName: LAMBDAS.RDS_CLOSE_AUCTION,
      LogType: 'Tail',
      Payload: JSON.stringify({ leagueId: leagueId })
    }

    const lambdaResponse = await lambda.invoke(lambdaParams).promise();
    const responsePayload = JSON.parse(lambdaResponse.Payload);
    console.log(responsePayload);

    const isAuctionClosed = await closeDynamoDbAuction(leagueId);

    if (!isAuctionClosed) {
      throw new Error('Unable to close auction in DynamoDb');
    }

    const payload = {
      msgType: 'auction_close',
      message: 'Auction closed'
    };

    // send the info to all active websocket connections
    const endpoint = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
    await websocketBroadcastToConnection(endpoint, connectionId, payload);

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ message: 'next team set' })
    });
  } catch (error) {
    console.log(error);
    
    const endpoint = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
    const payload = {
      msgType: 'auction_error',
      message: 'Unable to close auction'
    };
    await websocketBroadcastToConnection(endpoint, connectionId, payload);

    callback(null, {
      statusCode: 500,
      body: JSON.stringify({ message: 'error closing auction' })
    });
  }
}