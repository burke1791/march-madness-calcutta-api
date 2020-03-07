const sql = require('mssql');
import AWS from 'aws-sdk';

import { connection } from '../db';

export async function resetClock(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  console.log(event);
  let data = JSON.parse(event.body);
  let leagueId = data.leagueId;
  let connectionId = event.requestContext.connectionId;

  if (!connection.isConnected) {
    await connection.createConnection();
  }

  const request = new sql.Request();
  request.input('connectionId', sql.VarChar(128), connectionId);
  request.input('leagueId', sql.BigInt(), leagueId);

  try {
    let result = await request.execute('dbo.up_resetAuctionClock');
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