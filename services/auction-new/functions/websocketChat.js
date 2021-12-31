import AWS from 'aws-sdk';
import { verifyToken } from '../../../common/utilities/verify';

const dynamodb = new AWS.DynamoDB();
const lambda = new AWS.Lambda();

const CONNECTION_TABLE = process.env.CONNECTION_TABLE;
const CHAT_TABLE = process.env.CHAT_TABLE;

const LAMBDAS = {
  VERIFY_USER_LEAGUE: `calcutta-auction-service-v2-${process.env.APP_ENV}-verifyUserLeague`
};

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*'
};

export async function sendChatMessage(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  // await generateAllow('me', event.methodArn);

  const data = JSON.parse(event.body);

  const connectionId = event.requestContext.connectionId;
  const leagueId = data.leagueId;
  const content = data.content;

  console.log(connectionId, leagueId, content);

  try {
    const params = {
      TableName: CONNECTION_TABLE,
      Key: {
        ConnectionId: {
          S: connectionId
        }
      }
    };

    let response = await dynamodb.getItem(params).promise();
    console.log(response);

    if (!response?.Item.ConnectionId.S) {
      throw new Error('User does not exist in the Connection table');
    }

    const timestamp = new Date().valueOf();

    const chatParams = {
      TableName: CHAT_TABLE,
      Item: {
        LeagueId: {
          N: leagueId
        },
        Timestamp: {
          N: timestamp
        },
        Alias: {
          S: 'AliasPlaceholder'
        },
        UserId: {
          N: 'UserIdPlaceholder'
        },
        Content: {
          S: content
        }
      }
    };

    const chatObj = {
      UserId: 'UserIdPlaceholder',
      Alias: 'AliasPlaceholder',
      LeagueId: leagueId,
      Content: content,
      Timestamp: timestamp
    };

    let chatResponse = await dynamodb.putItem(chatParams).promise();
    console.log(chatResponse);

    const apig = new AWS.ApiGatewayManagementApi({
      apiVersion: '2018-11-29',
      endpoint: 'https://' + event.requestContext.domainName + '/' + event.requestContext.stage
    });

    // const postCalls = 
  } catch (error) {
    callback(null, {
      statusCode: 500,
      body: JSON.stringify({ message: 'chat not sent' })
    });
  }
}