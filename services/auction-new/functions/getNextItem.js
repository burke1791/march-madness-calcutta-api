import { websocketBroadcast, verifyLeagueConnection, setNewAuctionTeam, websocketBroadcastToConnection } from '../utilities';
import { getNextItemRandom, getNextItemSpecific } from './common/getNextItem';

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