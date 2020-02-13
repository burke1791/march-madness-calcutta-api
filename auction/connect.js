import { success } from '../libraries/response-lib';
import AWS from 'aws-sdk';

const sql = require('mssql');
const connection = require('../db').connection;
const verifyToken = require('../libraries/verify').verifyToken;
import { generateAllow, generateDeny } from '../utilities/generatePolicy';

export async function connectionManager(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  console.log(event);

  let cognitoSub = event.requestContext.authorizer.cognitoSub;
  let connectionId = event.requestContext.connectionId;
  let eventType = event.requestContext.eventType;

  if (!connection.isConnected) {
    await connection.createConnection();
  }

  if (eventType == 'CONNECT') {
    console.log('connect requested');

    let leagueId = event.queryStringParameters.leagueId;

    const request = new sql.Request();
    request.input('cognitoSub', sql.VarChar(256), cognitoSub);
    request.input('leagueId', sql.BigInt(), leagueId);
    request.input('connectionId', sql.VarChar(128), connectionId);
    let result = await request.execute('dbo.up_updateAuctionConnection');
    console.log(result);

    callback(null, success({ message: 'connected' }));
  } else if (eventType == 'DISCONNECT') {
    console.log('disconnect requested');

    let query = `Delete dbo.auctionConnections Where connectionId = '${connectionId}'`;
    let result = await connection.pool.request().query(query);
    console.log(result);

    callback(null, success({ message: 'disconnected' }));
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

export async function sendMessage(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  // const connectionId = event.requestContext.connectionId;

  console.log(event);
  // Retrieve the message from the socket payload
  const data = JSON.parse(event.body);
  const leagueId = data.leagueId;

  if (!connection.isConnected) {
    await connection.createConnection();
  }

  let query = `Select ac.connectionId From dbo.auctionConnections ac Where ac.leagueId = ${leagueId}`;
  console.log(query);
  const sockets = await connection.pool.request().query(query);

  console.log(sockets);

  const client = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: `https://${event.requestContext.domainName}/${event.requestContext.stage}`
  });
  console.log('new');
  try {
    await client.postToConnection({
      ConnectionId: event.requestContext.connectionId,
      Data: `default route received: ${event.body}`
    }).promise();
  } catch (error) {
    console.log(error);
  }

  callback(null, { statusCode: 200, body: 'sent' });
}