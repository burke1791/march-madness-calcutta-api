import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB();

const CONNECTION_TABLE = process.env.CONNECTION_TABLE;
const CONNECTION_INDEX = `${process.env.CONNECTION_TABLE}_LeagueId_CognitoSub`;

export async function websocketBroadcast(leagueId, payload, domainName, apiStage) {
  const connectionQueryParams = {
    TableName: CONNECTION_TABLE,
    IndexName: CONNECTION_INDEX,
    ExpressionAttributeValues: {
      ':v1': {
        N: String(leagueId)
      }
    },
    KeyConditionExpression: 'LeagueId = :v1',
    ProjectionExpression: 'ConnectionId'
  };

  try {
    const connectionQuery = await dynamodb.query(connectionQueryParams).promise();
    const connectionIds = connectionQuery.Items;

    const apig = new AWS.ApiGatewayManagementApi({
      apiVersion: '2018-11-29',
      endpoint: `https://${domainName}/${apiStage}`
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

    await Promise.all(postCalls);
  } catch (error) {
    console.log(error);
    return;
  }

  return;
}