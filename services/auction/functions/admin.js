import AWS from 'aws-sdk';
import { connection, BigInt, Varchar, Decimal } from '../../../common/utilities/db';

export async function resetClock(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  console.log(event);
  let data = JSON.parse(event.body);
  let leagueId = data.leagueId;
  let connectionId = event.requestContext.connectionId;

  if (!connection.isConnected) {
    await connection.createConnection();
  }

  try {
    let result = await connection.pool.request()
      .input('connectionId', Varchar(128), connectionId)
      .input('leagueId', BigInt, leagueId)
      .execute('dbo.up_resetAuctionClock');

    console.log(result);

    let connectionIds = result.recordset;
    let auctionStatus = result.recordsets[1][0];
    console.log(auctionStatus);

    let payload = {
      msgObj: auctionStatus,
      msgType: 'auction'
    };

    const apig = new AWS.ApiGatewayManagementApi({
      apiVersion: '2018-11-29',
      endpoint: 'https://' + event.requestContext.domainName + '/' + event.requestContext.stage
    });

    const postCalls = connectionIds.map(async obj => {
      console.log(obj);
      var params = {
        ConnectionId: obj.connectionId,
        Data: JSON.stringify(payload)
      };

      try {
        await apig.postToConnection(params).promise();
      } catch (error) {
        console.log(error);
      }
    });

    try {
      await Promise.all(postCalls);
    } catch (error) {
      callback(null, { statusCode: 500, body: error.stack });
    }

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ message: 'messages sent' })
    });
  } catch (error) {
    console.log(error);
    callback(null, {
      statusCode: 500,
      body: JSON.stringify({ message: 'chat not sent' })
    });
  }
}

export async function setItemComplete(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  console.log(event);
  let data = JSON.parse(event.body);
  let leagueId = data.leagueId;
  let connectionId = event.requestContext.connectionId;

  if (!connection.isConnected) {
    await connection.createConnection();
  }

  try {
    let result = await connection.pool.request()
      .input('connectionId', Varchar(128), connectionId)
      .input('leagueId', BigInt, leagueId)
      .execute('dbo.up_setItemComplete');

    console.log(result);

    let connectionIds = result.recordset;
    let auctionStatus = result.recordsets[1][0];
    console.log(auctionStatus);

    let payload = {
      msgObj: auctionStatus,
      msgType: 'auction'
    };

    await sendWebsocketPayloads(connectionIds, payload, event.requestContext.domainName, event.requestContext.stage);

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ message: 'messages not sent' })
    });
  } catch (error) {
    console.log(error);
    callback(null, {
      statusCode: 500,
      body: JSON.stringify({ message: 'messages not sent' })
    });
  }
}

export async function placeBid(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  console.log(event);
  let data = JSON.parse(event.body);
  let leagueId = data.leagueId;
  let connectionId = event.requestContext.connectionId;
  let amount = data.amount;

  if (!connection.isConnected) {
    await connection.createConnection();
  }

  try {
    let result = await connection.pool.request()
      .input('connectionId', Varchar(128), connectionId)
      .input('leagueId', BigInt, leagueId)
      .input('bidVal', Decimal(8, 2), amount)
      .execute('dbo.up_placeBid');

    console.log(result);

    if (result.recordset == undefined) {
      let payload = {
        message: 'Invalid Bid',
        msgType: 'auction_error'
      };

      await sendWebsocketPayloads([{ connectionId }], payload, event.requestContext.domainName, event.requestContext.stage);

      callback(null, {
        statusCode: 200,
        body: JSON.stringify({ message: 'messages sent' })
      });
    } else {
      let connectionIds = result.recordset;
      let auctionStatus = result.recordsets[1][0];
      console.log(auctionStatus);

      let payload = {
        msgObj: auctionStatus,
        msgType: 'auction'
      };

      await sendWebsocketPayloads(connectionIds, payload, event.requestContext.domainName, event.requestContext.stage);

      callback(null, {
        statusCode: 200,
        body: JSON.stringify({ message: 'messages sent' })
      });
    }
  } catch (error) {
    console.log(error);
    callback(null, {
      statusCode: 500,
      body: JSON.stringify({ message: 'messages not sent' })
    });
  }
}

export async function setNextItem(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  console.log(event);
  let data = JSON.parse(event.body);
  let leagueId = data.leagueId;
  let connectionId = event.requestContext.connectionId;

  if (!connection.isConnected) {
    await connection.createConnection();
  }

  try {
    let result = await connection.pool.request()
      .input('connectionId', Varchar(128), connectionId)
      .input('leagueId', BigInt, leagueId)
      .execute('dbo.up_nextItem');

    console.log(result);

    let connectionIds = result.recordset;
    let auctionStatus = result.recordsets[1][0];
    console.log(auctionStatus);

    let payload = {
      msgObj: auctionStatus,
      msgType: 'auction'
    };

    await sendWebsocketPayloads(connectionIds, payload, event.requestContext.domainName, event.requestContext.stage);

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ message: 'messages not sent' })
    });
  } catch (error) {
    console.log(error);
    callback(null, {
      statusCode: 500,
      body: JSON.stringify({ message: 'messages not sent' })
    });
  }
}

export async function startAuction(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  console.log(event);
  let data = JSON.parse(event.body);
  let leagueId = data.leagueId;
  let connectionId = event.requestContext.connectionId;

  if (!connection.isConnected) {
    await connection.createConnection();
  }

  try {
    let result = await connection.pool.request()
      .input('connectionId', Varchar(128), connectionId)
      .input('leagueId', BigInt, leagueId)
      .execute('dbo.up_startAuction');

    console.log(result);

    let connectionIds = result.recordset;
    let auctionStatus = result.recordsets[1][0];
    console.log(auctionStatus);

    let isError = Object.keys(auctionStatus)[0] === 'Error';

    let payload = {
      msgObj: auctionStatus
    };

    if (isError) {
      payload.msgType = 'error';
    } else {
      payload.msgType = 'auction';
    }

    await sendWebsocketPayloads(connectionIds, payload, event.requestContext.domainName, event.requestContext.stage, callback);

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ message: 'messages not sent' })
    });
  } catch (error) {
    console.log(error);
    callback(null, {
      statusCode: 500,
      body: JSON.stringify({ message: 'messages not sent' })
    });
  }
}

export async function closeAuction(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  console.log(event);
  let data = JSON.parse(event.body);
  let leagueId = data.leagueId;
  let connectionId = event.requestContext.connectionId;

  if (!connection.isConnected) {
    await connection.createConnection();
  }

  try {
    let result = await connection.pool.request()
      .input('connectionId', Varchar(128), connectionId)
      .input('leagueId', BigInt, leagueId)
      .execute('dbo.up_closeAuction');

    console.log(result);

    let connectionIds = result.recordset;
    let auctionStatus = result.recordsets[1][0];
    console.log(auctionStatus);

    let payload = {
      msgObj: auctionStatus,
      msgType: 'auction'
    };

    await sendWebsocketPayloads(connectionIds, payload, event.requestContext.domainName, event.requestContext.stage);

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ message: 'messages not sent' })
    });
  } catch (error) {
    console.log(error);
    callback(null, {
      statusCode: 500,
      body: JSON.stringify({ message: 'messages not sent' })
    });
  }
}

async function sendWebsocketPayloads(connectionIds, payload, domainName, stage) {
  console.log(domainName, stage);

  const apig = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: 'https://' + domainName + '/' + stage
  });

  const postCalls = connectionIds.map(async obj => {
    console.log(obj);
    var params = {
      ConnectionId: obj.connectionId,
      Data: JSON.stringify(payload)
    };

    try {
      await apig.postToConnection(params).promise();
    } catch (error) {
      console.log(error);
      return;
    }
  });

  try {
    await Promise.all(postCalls);
  } catch (error) {
    console.log(error);
    return;
  }

  return;
}