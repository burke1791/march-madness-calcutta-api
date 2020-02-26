const sql = require('mssql');
import AWS from 'aws-sdk';

const verifyToken = require('../libraries/verify').verifyToken;
import { generateAllow, generateDeny } from '../utilities/generatePolicy';
import { connection } from '../db';

export async function onConnect(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  console.log(event);

  let connectionId = event.requestContext.connectionId;
  let leagueId = event.queryStringParameters.leagueId;
  let cognitoSub = await verifyToken(event.queryStringParameters.Authorizer);
  console.log(cognitoSub);

  // populate the connections table in SQL Server
  if (!connection.isConnected) {
    await connection.createConnection();
  }

  const request = new sql.Request();
  request.input('cognitoSub', sql.VarChar(256), cognitoSub);
  request.input('leagueId', sql.BigInt(), leagueId);
  request.input('connectionId', sql.VarChar(128), connectionId);

  try {
    await request.execute('dbo.up_updateAuctionConnection');

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ message: 'connected' }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    callback(null, {
      statusCode: 500,
      body: JSON.stringify({ message: 'could not connect'}),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function onDisconnect(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  console.log(event);

  let connectionId = event.requestContext.connectionId;
  // let cognitoSub = 'test';

  // delete from the connections table in SQL Server
  if (!connection.isConnected) {
    await connection.createConnection();
  }

  try {
    await connection.pool.request().query('Delete dbo.auctionConnections Where connectionId = \'' + connectionId + '\'');

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ message: 'disconnected' }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch(error) {
    callback(null, {
      statusCode: 500,
      body: JSON.stringify({ message: 'could not disconnect' }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function handleMessage(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  await generateAllow('me', event.methodArn);

  console.log(event);

  let data = JSON.parse(event.body);

  let connectionId = event.requestContext.connectionId;
  let leagueId = data.leagueId;
  let content = data.content;

  console.log(connectionId, leagueId, content);

  // query SQL Server for the connectionIds for a given league
  if (!connection.isConnected) {
    await connection.createConnection();
  }

  const request = new sql.Request();
  request.input('leagueId', sql.BigInt(), leagueId);
  request.input('connectionId', sql.VarChar(128), connectionId);
  request.input('content', sql.VarChar(512), content);

  try {
    let result = await request.execute('dbo.up_sendAuctionChat');
    console.log(result);
    let connectionIds = result.recordset;

    const apig = new AWS.ApiGatewayManagementApi({
      apiVersion: '2018-11-29',
      endpoint: 'https://' + event.requestContext.domainName + '/' + event.requestContext.stage
    });

    const postCalls = connectionIds.map(async obj => {
      console.log(obj);
      var params = {
        ConnectionId: obj.connectionId,
        Data: content
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

    callback(null,  {
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

// @TODO: query DB to make sure the user can connect to the league channel
export async function authWebsocket(event, context, callback) {
  // const methodArn = event.methodArn;
  const token = event.queryStringParameters.Authorizer;
  // let leagueId = event.queryStringParameters.leagueId;
  console.log(event);
  let cognitoSub = await verifyToken(token);
  console.log(cognitoSub);

  if (!token) {
    callback(null, generateDeny('me', event.methodArn));
  } else {
    callback(null, generateAllow('me', event.methodArn, cognitoSub));
  }
}
