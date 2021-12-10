import AWS from 'aws-sdk';
import { verifyToken } from '../../../common/utilities/verify';
// import { generateAllow, generateDeny } from '../../../common/utilities/generatePolicy';

const dynamoDb = new AWS.DynamoDB.DocumentClient();

// const AUCTION_TABLE = process.env.AUCTION_TABLE;
const CONNECTION_TABLE = process.env.CONNECTION_TABLE;
// const CHAT_TABLE = process.env.CHAT_TABLE;

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*'
};

export async function onConnect(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const connectionId = event.requestContext.connectionId;
  const leagueId = event.queryStringParameters.leagueId;
  const cognitoSub = await verifyToken(event.queryStringParameters.Authorizer);

  const params = {
    TableName: CONNECTION_TABLE,
    Item: {
      LeagueId: leagueId,
      CognitoSub: cognitoSub,
      ConnectionId: connectionId
    }
  };

  console.log(params);

  try {
    const response = await dynamoDb.put(params).promise();
    console.log(response);
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(response),
      headers: headers
    });
  } catch (error) {
    console.log(error);
    callback(null, {
      statusCode: 500,
      body: JSON.stringify(error),
      headers: headers
    });
  }
}

export async function onDisconnect(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const connectionId = event.requestContext.connectionId;

  const params = {
    TableName: CONNECTION_TABLE,
    Key: {
      ConnectionId: {
        S: connectionId
      }
    }
  };

  try {
    const response = await dynamoDb.deleteItem(params).promise();

    callback(null, {
      statusCode: 200,
      body: JSON.stringify(response),
      headers: headers
    });
  } catch (error) {
    console.log(error);
    callback(null, {
      statusCode: 500,
      body: JSON.stringify(error),
      headers: headers
    });
  }
}