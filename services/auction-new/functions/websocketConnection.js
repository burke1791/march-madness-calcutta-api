import AWS from 'aws-sdk';
import { verifyToken } from '../../../common/utilities/verify';
import { DYNAMODB_TABLES, LAMBDAS } from '../utilities/constants';

const dynamodb = new AWS.DynamoDB();
const lambda = new AWS.Lambda();

const CONNECTION_TABLE = DYNAMODB_TABLES.CONNECTION_TABLE;

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*'
};

export async function onConnect(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const connectionId = event.requestContext.connectionId;
  const leagueId = event.queryStringParameters.leagueId;
  const cognitoSub = await verifyToken(event.queryStringParameters.Authorizer);

  try {
    const lambdaParams = {
      FunctionName: LAMBDAS.RDS_VERIFY_USER_LEAGUE,
      LogType: 'Tail',
      Payload: JSON.stringify({ leagueId: leagueId, cognitoSub: cognitoSub })
    };

    const lambdaResponse = await lambda.invoke(lambdaParams).promise();
    console.log(lambdaResponse);
    const responsePayload = JSON.parse(lambdaResponse.Payload);

    if (!responsePayload.length) {
      console.log('User not found - throw');
      throw new Error('Could not find a matching registered user');
    }

    const userId = responsePayload[0].UserId;
    const alias = responsePayload[0].Alias;
    const roleId = responsePayload[0].RoleId

    const params = {
      TableName: CONNECTION_TABLE,
      Item: {
        LeagueId: {
          N: leagueId
        },
        CognitoSub: {
          S: cognitoSub
        },
        ConnectionId: {
          S: connectionId
        },
        UserId: {
          N: String(userId)
        },
        Alias: {
          S: alias
        },
        RoleId: {
          N: String(roleId)
        }
      }
    };
  
    console.log(params);

    const response = await dynamodb.putItem(params).promise();
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

  const deleteItemParams = {
    TableName: CONNECTION_TABLE,
    Key: {
      ConnectionId: {
        S: connectionId
      }
    }
  };

  try {
    const response = await dynamodb.deleteItem(deleteItemParams).promise();
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