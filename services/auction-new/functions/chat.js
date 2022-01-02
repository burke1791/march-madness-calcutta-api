import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB();
const lambda = new AWS.Lambda();

const CHAT_TABLE = process.env.CHAT_TABLE;
const LAMBDAS = {
  VERIFY_USER_LEAGUE: `calcutta-auction-service-v2-${process.env.APP_ENV}-verifyUserLeague`
};

export async function getAllMessages(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const cognitoSub = event.cognitoPoolClaims.sub;
  const leagueId = event.path.leagueId;

  try {
    const lambdaParams = {
      FunctionName: LAMBDAS.VERIFY_USER_LEAGUE,
      LogType: 'Tail',
      Payload: JSON.stringify({ leagueId: leagueId, cognitoSub: cognitoSub })
    };

    const lambdaResponse = await lambda.invoke(lambdaParams).promise();
    const responsePayload = JSON.parse(lambdaResponse.Payload);

    if (!responsePayload.length) {
      console.log('User not found - throw');
      throw new Error('Could not find a matching registered user');
    }

    const messagesQuery = {
      TableName: CHAT_TABLE,
      ExpressionAttributeValues: {
        ':v1': {
          N: leagueId
        }
      },
      KeyConditionExpression: 'LeagueId = :v1',
      ProjectionExpression: 'ChatMessage'
    };

    const response = await dynamodb.query(messagesQuery).promise();

    console.log(response);

    callback(null, response.Items);
  } catch (error) {
    console.log(error);
    callback(null, error);
  }
}