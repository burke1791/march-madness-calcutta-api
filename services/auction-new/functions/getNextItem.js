import AWS from 'aws-sdk';
import { websocketBroadcast, verifyLeagueConnection, setNewAuctionTeam, websocketBroadcastToConnection } from '../utilities';
import { AUCTION_STATUS } from '../utilities/constants';
import { getAuctionStatus } from './common/auctionStatus';
import { getNextItemRandom, getNextItemSpecific } from './common/getNextItem';
import { LAMBDAS } from '../utilities/constants';

const lambda = new AWS.Lambda();

export async function getNextItem(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const data = JSON.parse(event.body);
  console.log(data);
  const { leagueId, itemId, itemTypeId } = data;
  const connectionId = event.requestContext.connectionId;

  try {
    // verify the leagueId matches the connection
    const verifyResponse = await verifyLeagueConnection(leagueId, connectionId);

    if (verifyResponse === false || +verifyResponse.RoleId > 2) {
      throw new Error('User is not allowed to perform this action');
    }

    const status = await getAuctionStatus(leagueId);

    if (status.Status == AUCTION_STATUS.INITIAL || status.Status == AUCTION_STATUS.END) {
      // mark the auction as in-progress in SQL Server
      const lambdaParams = {
        FunctionName: LAMBDAS.RDS_START_AUCTION,
        LogType: 'Tail',
        Payload: JSON.stringify({ leagueId: leagueId })
      }
  
      const lambdaResponse = await lambda.invoke(lambdaParams).promise();
      const responsePayload = JSON.parse(lambdaResponse.Payload);
      console.log(responsePayload);
      
      if (!responsePayload?.length || !!responsePayload[0]?.Error) {
        throw new Error('Could not set league status');
      }
    }

    let teamObj;

    if (itemId && itemTypeId) {
      teamObj = await getNextItemSpecific(leagueId, itemId, itemTypeId);
    } else {
      teamObj = await getNextItemRandom(leagueId);
    }

    if (teamObj == undefined) {
      throw new Error('No available slots');
    }

    // write that info to dynamodb
    const auctionObj = await setNewAuctionTeam(leagueId, teamObj);
    console.log(auctionObj);

    if (!auctionObj) {
      throw new Error('Error updating auction record');
    }

    const auctionPayload = {
      status: auctionObj
    };

    const payload = {
      msgType: 'auction_bid',
      msgObj: auctionPayload
    }

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
      body: JSON.stringify({ message: 'error getting next team' })
    });
  }
}