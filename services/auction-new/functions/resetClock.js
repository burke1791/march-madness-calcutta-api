import { verifyLeagueConnection, websocketBroadcast, resetAuctionClock } from '../utilities';

export async function resetClock(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const data = JSON.parse(event.body);
  const leagueId = data.leagueId;
  const connectionId = event.requestContext.connectionId;

  try {
    // verify the leagueId matches the connection
    const verifyResponse = await verifyLeagueConnection(leagueId, connectionId);

    if (verifyResponse === false || +verifyResponse.RoleId > 2) {
      throw new Error('User is not allowed to perform this action');
    }

    const resetObj = await resetAuctionClock(leagueId);

    if (!resetObj) {
      throw new Error('Error updating auction record');
    }

    const auctionPayload = {
      status: resetObj
    }

    const payload = {
      msgObj: auctionPayload,
      msgType: 'auction_bid'
    }

    // send the info to all active websocket connections
    await websocketBroadcast(leagueId, payload, event.requestContext.domainName, event.requestContext.stage);

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ message: 'clock reset' })
    });
  } catch (error) {
    console.log(error);
    callback(null,  {
      statusCode: 500,
      body: JSON.stringify({ message: 'error resetting the clock' })
    });
  }
}