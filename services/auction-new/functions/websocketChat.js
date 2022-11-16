import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { DYNAMODB_INDEXES, DYNAMODB_TABLES } from '../utilities/constants';

const dynamodb = new AWS.DynamoDB();

const CONNECTION_TABLE = DYNAMODB_TABLES.CONNECTION_TABLE;
const CONNECTION_INDEX = DYNAMODB_INDEXES.CONNECTION_INDEX;
const CHAT_TABLE = DYNAMODB_TABLES.CHAT_TABLE;

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

    const userId = response.Item.UserId.N;
    const alias = response.Item.Alias.S;

    // @TODO: verify the leagueId in dynamodb matches the leagueId in the request body
    if (!response?.Item.ConnectionId.S) {
      throw new Error('User does not exist in the Connection table');
    }

    const timestamp = new Date().valueOf().toString();
    const messageId = uuidv4();

    const chatParams = {
      TableName: CHAT_TABLE,
      Item: {
        LeagueId: {
          N: String(leagueId)
        },
        Timestamp: {
          N: timestamp
        },
        MessageId: {
          S: messageId
        },
        Alias: {
          S: alias
        },
        UserId: {
          N: userId
        },
        Content: {
          S: content
        }
      }
    };

    const chatObj = {
      MessageId: messageId,
      UserId: userId,
      Alias: alias,
      LeagueId: leagueId,
      Content: content,
      Timestamp: timestamp
    };

    const payload = {
      msgObj: chatObj,
      msgType: 'chat'
    };

    let chatResponse = await dynamodb.putItem(chatParams).promise();
    console.log('Chat Response:');
    console.log(chatResponse);

    // @TODO: verify the message was sent to the table

    const queryParams = {
      TableName: CONNECTION_TABLE,
      IndexName: CONNECTION_INDEX,
      ExpressionAttributeValues: {
        ':v1': {
          N: leagueId
        }
      },
      KeyConditionExpression: 'LeagueId = :v1',
      ProjectionExpression: 'ConnectionId'
    };

    const connectionIdQuery = await dynamodb.query(queryParams).promise();
    const connectionIds = connectionIdQuery.Items;

    const apig = new AWS.ApiGatewayManagementApi({
      apiVersion: '2018-11-29',
      endpoint: 'https://' + event.requestContext.domainName + '/' + event.requestContext.stage
    });

    const postCalls = connectionIds.map(async (connectionId) => {
      const params = {
        ConnectionId: connectionId.ConnectionId.S,
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