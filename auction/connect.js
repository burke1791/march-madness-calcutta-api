import { success } from '../libraries/response-lib';
import AWS from 'aws-sdk';
import * as dynamodb from '../libraries/dynamodb-lib';

const verifyToken = require('../libraries/verify').verifyToken;
import { generateAllow, generateDeny } from '../utilities/generatePolicy';

export async function connectionManager(event, context, callback) {
  // context.callbackWaitsForEmptyEventLoop = false;

  console.log(event);

  // let cognitoSub = event.requestContext.authorizer.cognitoSub;
  let connectionId = event.requestContext.connectionId;
  let leagueId = event.queryStringParameters.leagueId;
  let eventType = event.requestContext.eventType;

  if (eventType == 'CONNECT') {
    console.log('connect requested');
    let params = {
      TableName: process.env.auctionConnections,
      Item: {
        leagueId: leagueId,
        connectionId: connectionId
      }
    };

    // add connectionId to dynamodb
    await dynamodb.call('put', params);

    callback(null, success({ message: 'connected' }));
  } else if (eventType == 'DISCONNECT') {
    console.log('disconnect requested');
    let params = {
      TableName: process.env.auctionConnections,
      Key: {
        leagueId: leagueId,
        connectionId: connectionId
      }
    }

    // remove connectionId from dynamodb
    await dynamodb.call('delete', params);

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

  const client = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: `${event.requestContext.domainName}/${event.requestContext.stage}`
  });

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