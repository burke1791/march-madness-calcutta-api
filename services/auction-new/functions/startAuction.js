import AWS from 'aws-sdk';
import { websocketBroadcast, verifyLeagueConnection, setNewAuctionTeam } from '../utilities';
import { LAMBDAS } from '../utilities/constants';
import { getNextItemRandom } from './common/getNextItem';
import { reopenDynamoDbAuction } from '../utilities/updateAuctionRecord';

const lambda = new AWS.Lambda();

export async function startAuction(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const data = JSON.parse(event.body);
  console.log(data);
  const leagueId = data.leagueId;
  const isReopen = !!data?.isReopen;
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
    
    if (responsePayload != null) {
      throw new Error('Could not set league status');
    }

    let auctionObj;

    if (!isReopen) {
      const teamObj = await getNextItemRandom(leagueId);

      if (teamObj == undefined) {
        throw new Error('No available slots');
      }
  
      // set the next item in dynamodb
      auctionObj = await setNewAuctionTeam(leagueId, teamObj);
    } else {
      auctionObj = await reopenDynamoDbAuction(leagueId);
    }

    if (!auctionObj) {
      throw new Error('Error updating auction record');
    }

    const auctionPayload = {
      status: auctionObj
    };

    const payload = {
      msgObj: auctionPayload,
      msgType: 'auction_open'
    };

    // send the info to all active websocket connections
    await websocketBroadcast(leagueId, payload, event.requestContext.domainName, event.requestContext.stage);

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ message: 'next team set' })
    });
  } catch (error) {
    console.log(error);

    const endpoint = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
    const payload = {
      msgType: 'auction_error',
      message: 'No available items'
    };
    await websocketBroadcastToConnection(endpoint, connectionId, payload);
    
    callback(null, {
      statusCode: 500,
      body: JSON.stringify({ message: 'error starting auction' })
    });
  }
}