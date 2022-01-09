import AWS from 'aws-sdk';
import { websocketBroadcast } from '../utilities/websocketBroadcast';

const dynamodb = new AWS.DynamoDB();
const lambda = new AWS.Lambda();

const CONNECTION_TABLE = process.env.CONNECTION_TABLE;
const AUCTION_TABLE = process.env.AUCTION_TABLE;

const LAMBDAS = {
  GET_NEXT_ITEM: `calcutta-auction-service-v2-${process.env.APP_ENV}-rdsGetNextItem`
};

export async function getNextItem(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const data = JSON.parse(event.body);
  console.log(data);
  const leagueId = data.leagueId;
  const connectionId = event.requestContext.connectionId;

  // verify the leagueId matches the connection
  const connectionParams = {
    TableName: CONNECTION_TABLE,
    Key: {
      ConnectionId: {
        S: connectionId
      }
    },
    ProjectionExpression: 'LeagueId'
  };

  try {
    const connectionResponse = await dynamodb.getItem(connectionParams).promise();

    console.log(connectionResponse);

    const connectionLeagueId = connectionResponse.Item.LeagueId.N;

    if (connectionLeagueId != leagueId) {
      throw new Error('LeagueIds do not match');
    }

    // get the next item information from RDS
    const lambdaParams = {
      FunctionName: LAMBDAS.GET_NEXT_ITEM,
      LogType: 'Tail',
      Payload: JSON.stringify({ leagueId: leagueId })
    };

    const lambdaResponse = await lambda.invoke(lambdaParams).promise();
    const responsePayload = JSON.parse(lambdaResponse.Payload);
    console.log(responsePayload);

    if (!responsePayload.length || !!responsePayload[0]?.Error) {
      throw new Error('No available teams');
    }

    const teamObj = responsePayload[0];

    const timestamp = new Date().valueOf().toString();

    // write that info to dynamodb
    const auctionParams = {
      TableName: AUCTION_TABLE,
      ReturnValues: 'ALL_NEW',
      Key: {
        LeagueId: {
          N: String(leagueId)
        }
      },
      ExpressionAttributeNames: {
        '#LId': 'LeagueId',
        '#TS': 'LastBidTimestamp',
        '#S': 'Status',
        '#CId': 'CurrentItemId',
        '#P': 'CurrentItemPrice',
        '#W': 'CurrentItemWinner',
        '#A': 'Alias',
        '#L': 'TeamLogoUrl',
        '#IT': 'ItemTypeId',
        '#N': 'ItemName',
        '#Sd': 'Seed',
        '#DN': 'DisplayName'
      },
      ExpressionAttributeValues: {
        ':LId': {
          N: String(leagueId)
        },
        ':TS': {
          N: timestamp
        },
        ':S': {
          S: 'bidding'
        },
        ':CId': {
          N: String(teamObj.CurrentItemId)
        },
        ':P': {
          N: '0'
        },
        ':W': {
          N: null
        },
        ':A': {
          S: null
        },
        ':L': {
          S: teamObj.TeamLogoUrl
        },
        ':IT': {
          N: String(teamObj.ItemTypeId)
        },
        ':N': {
          S: teamObj.ItemName
        },
        ':Sd': {
          N: String(teamObj.Seed)
        },
        ':DN': {
          S: teamObj.DisplayName
        }
      },
      UpdateExpression: 'SET #LId = :LId, #TS = :TS, #S = :S, #CId = :CId, #P = :P, #W = :W, #A = :A, #L = :L, #IT = :IT, #N = :N, #Sd = :Sd, #DN = :DN'
    };

    const auctionResponse = await dynamodb.updateItem(auctionParams).promise();
    console.log(auctionResponse);

    const updateData = auctionResponse.Attributes;

    // send the info to all active websocket connections
    const auctionObj = {
      Status: updateData.Status.S,
      CurrentItemId: updateData.CurrentItemId.N,
      TeamLogoUrl: updateData.TeamLogoUrl.S,
      ItemTypeId: updateData.ItemTypeId.N,
      ItemName: updateData.ItemName.S,
      Seed: updateData.Seed.N,
      DisplayName: updateData.DisplayName.S,
      CurrentItemPrice: updateData.CurrentItemPrice.N,
      CurrentItemWinner: updateData.CurrentItemWinner.N,
      Alias: updateData.Alias.S,
      LastBidTimestamp: updateData.LastBidTimestamp.N
    };

    await websocketBroadcast(leagueId, auctionObj, event.requestContext.domainName, event.requestContext.stage);

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ message: 'next team set' })
    });
  } catch (error) {
    console.log(error);
    callback(null, {
      statusCode: 500,
      body: JSON.stringify({ message: 'error getting next team' })
    });
  }
}