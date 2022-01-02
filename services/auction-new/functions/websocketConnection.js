import AWS from 'aws-sdk';
import { verifyToken } from '../../../common/utilities/verify';

const dynamodb = new AWS.DynamoDB();
const lambda = new AWS.Lambda();

const CONNECTION_TABLE = process.env.CONNECTION_TABLE;
const CONNECTION_INDEX = `${process.env.CONNECTION_TABLE}_ConnectionId`;

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
    const responsePayload = JSON.parse(lambdaResponse.Payload);

    if (!responsePayload.length) {
      console.log('User not found - throw');
      throw new Error('Could not find a matching registered user');
    }

    userId = responsePayload[0].UserId;
    alias = responsePayload[0].Alias;
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
        N: leagueId
      },
      CognitoSub: {
        S: cognitoSub
      },
      ConnectionId: {
        S: connectionId
      },
      UserId: {
        N: userId
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

  const indexSearchParams = {
    IndexName: CONNECTION_INDEX,
    Key: {
      ConnectionId: {
        S: connectionId
      }
    }
  };

  try {
    const keyResponse = await dynamodb.getItem(indexSearchParams).promise();

    const leagueId = keyResponse.Item.LeagueId.N;

    const deleteItemParams = {
      TableName: CONNECTION_TABLE,
      Key: {
        LeagueId: {
          N: leagueId
        },
        ConnectionId: {
          S: connectionId
        }
      }
    };

    const response = await dynamodb.deleteItem(deleteItemParams).promise();

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