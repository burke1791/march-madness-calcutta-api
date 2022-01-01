import AWS from 'aws-sdk';
import { verifyToken } from '../../../common/utilities/verify';

const dynamodb = new AWS.DynamoDB();
const lambda = new AWS.Lambda();

const CONNECTION_TABLE = process.env.CONNECTION_TABLE;

const LAMBDAS = {
  VERIFY_USER_LEAGUE: `calcutta-auction-service-v2-${process.env.APP_ENV}-verifyUserLeague`
};

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*'
};

export async function onConnect(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const connectionId = event.requestContext.connectionId;
  const leagueId = event.queryStringParameters.leagueId;
  const cognitoSub = await verifyToken(event.queryStringParameters.Authorizer);

  let userId, alias;

  try {
    const lambdaParams = {
      FunctionName: LAMBDAS.VERIFY_USER_LEAGUE,
      LogType: 'Tail',
      Payload: JSON.stringify({ leagueId: leagueId, cognitoSub: cognitoSub })
    };

    const lambdaResponse = await lambda.invoke(lambdaParams).promise();
    console.log(lambdaResponse);

    if (!lambdaResponse?.Payload.length) {
      console.log('User not found - throw');
      throw new Error('Could not find a matching registered user');
    }

    userId = lambdaResponse.Payload[0].UserId;
    alias = lambdaResponse.Payload[0].Alias;
    console.log(userId);
    console.log(alias);
  } catch (error) {
    console.log(error);
    callback(null, {
      statusCode: 500,
      body: JSON.stringify(error),
      headers: headers
    });
  }

  const params = {
    TableName: CONNECTION_TABLE,
    Item: {
      LeagueId: {
        N: Number(leagueId)
      },
      CognitoSub: {
        S: cognitoSub
      },
      ConnectionId: {
        S: connectionId
      },
      UserId: {
        N: Number(userId)
      },
      Alias: {
        S: alias
      }
    }
  };

  console.log(params);

  try {
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

  const params = {
    TableName: CONNECTION_TABLE,
    Key: {
      ConnectionId: {
        S: connectionId
      }
    }
  };

  try {
    const response = await dynamodb.deleteItem(params).promise();

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