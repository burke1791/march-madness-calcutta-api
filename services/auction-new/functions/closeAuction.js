import AWS from 'aws-sdk';
import { verifyLeagueConnection, websocketBroadcastToConnection, closeDynamoDbAuction, websocketBroadcastAll } from '../utilities';
import { LAMBDAS } from '../utilities/constants';
import { getAuctionSettings } from './common/auctionSettings';
import { getAuctionSales } from './common/auctionResults';
import { populateSlotsWithSales } from './common/payload';
import { validateUser } from './common/validateUser';

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

    await closeAuctionSqlServer(leagueId);

    const status = await closeDynamoDbAuction(leagueId);

    if (status === false) {
      throw new Error('Unable to close auction in DynamoDb');
    }

    const payload = {
      msgType: 'auction_close',
      msgObj: { status: status, message: 'Auction closed' }
    };

    // send the info to all active websocket connections
    const endpoint = `https://${process.env.WEBSOCKET_ENDPOINT}`;
    await websocketBroadcastAll(leagueId, payload, endpoint);

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ message: 'auction closed' })
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

export async function closeAuctionHttp(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const cognitoSub = event.cognitoPoolClaims.sub;
  const leagueId = event.path.leagueId;

  try {
    if (!(await validateUser(leagueId, cognitoSub, 2))) {
      throw new Error('User is not allowed to perform this action');
    }

    await closeAuctionSqlServer(leagueId);

    const status = await closeDynamoDbAuction(leagueId);

    if (status === false) {
      throw new Error('Unable to close auction in DynamoDb');
    }

    const payload = {
      msgType: 'auction_close',
      msgObj: { status: status, message: 'Auction closed' }
    };

    // send the info to all active websocket connections
    const endpoint = `https://${process.env.WEBSOCKET_ENDPOINT}`;
    await websocketBroadcastAll(leagueId, payload, endpoint);

    callback(null, { message: 'Auction closed' });
  } catch (error) {
    console.log(error);

    callback(null, { message: error.message });
  }
}

async function closeAuctionSqlServer(leagueId) {
  const { slots } = await getAuctionSettings(leagueId, 'LeagueId, AuctionSlots');
  const sales = await getAuctionSales(leagueId);
  const results =  populateSlotsWithSales(slots, sales);
  console.log(results);

  // update the auction status in SQL Server
  const lambdaParams = {
    FunctionName: LAMBDAS.RDS_CLOSE_AUCTION,
    LogType: 'Tail',
    Payload: JSON.stringify({ leagueId: leagueId, results: results })
  }

  const lambdaResponse = await lambda.invoke(lambdaParams).promise();
  const responsePayload = JSON.parse(lambdaResponse.Payload);
  console.log(responsePayload);

  if (responsePayload != null) {
    throw new Error('Unable to close auction in SQL Server');
  }
}