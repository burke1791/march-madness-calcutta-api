import AWS from 'aws-sdk';
import { verifyLeagueConnection, websocketBroadcast, websocketBroadcastToConnection } from '../utilities';
import { DYNAMODB_TABLES, LAMBDAS } from '../utilities/constants';

const AUCTION_TABLE = DYNAMODB_TABLES.AUCTION_TABLE;

const dynamodb = new AWS.DynamoDB();
const lambda = new AWS.Lambda();

export async function setItemComplete(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const data = JSON.parse(event.body);

  const leagueId = data.leagueId;
  const connectionId = event.requestContext.connectionId;

  try {
    const verifyResponse = await verifyLeagueConnection(leagueId, connectionId);

    if (verifyResponse === false || +verifyResponse.RoleId > 2) {
      throw new Error('User is not allowed to perform this action');
    }

    const timestamp = new Date().valueOf();

    const itemCompleteParams = {
      TableName: AUCTION_TABLE,
      ReturnValues: 'ALL_NEW',
      Key: {
        LeagueId: {
          N: String(leagueId)
        }
      },
      ExpressionAttributeNames: {
        '#TS': 'LastBidTimestamp',
        '#S': 'Status'
      },
      ExpressionAttributeValues: {
        ':S': {
          S: 'sold'
        },
        ':S_cond': {
          S: 'bidding'
        },
        ':TS_cond': {
          N: (timestamp - 7000).toString() // hacky way to make sure we're not selling an item due to an unfortunate race condition
        }
      },
      UpdateExpression: 'SET #S = :S',
      ConditionExpression: '#S = :S_cond and #TS < :TS_cond'
    }

    const itemCompleteResponse = await dynamodb.updateItem(itemCompleteParams).promise();

    const updateData = itemCompleteResponse.Attributes;
    console.log(updateData);

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

    const payload = {
      msgObj: auctionObj,
      msgType: 'auction'
    }

    await websocketBroadcast(leagueId, payload, event.requestContext.domainName, event.requestContext.stage);

    const lambdaPayload = {
      leagueId: leagueId,
      itemTypeId: updateData.ItemTypeId.N,
      itemId: updateData.CurrentItemId.N,
      userId: updateData.CurrentItemWinner.N,
      price: updateData.CurrentItemPrice.N
    }

    const lambdaParams = {
      FunctionName: LAMBDAS.RDS_SET_ITEM_COMPLETE,
      LogType: 'Tail',
      Payload: JSON.stringify(lambdaPayload)
    }

    const lambdaResponse = await lambda.invoke(lambdaParams).promise();
    console.log(lambdaResponse);

    const itemConfirmedCompleteParams = {
      TableName: AUCTION_TABLE,
      ReturnValues: 'ALL_NEW',
      Key: {
        LeagueId: {
          N: String(leagueId)
        }
      },
      ExpressionAttributeNames: {
        '#S': 'Status'
      },
      ExpressionAttributeValues: {
        ':S': {
          S: 'confirmed-sold'
        }
      },
      UpdateExpression: 'SET #S = :S'
    }

    const itemConfirmedCompleteResponse = await dynamodb.updateItem(itemConfirmedCompleteParams).promise();

    const confirmedUpdateData = itemConfirmedCompleteResponse.Attributes;
    console.log(confirmedUpdateData);

    const confirmedAuctionObj = {
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

    const confirmedPayload = {
      msgObj: confirmedAuctionObj,
      msgType: 'auction'
    }

    await websocketBroadcast(leagueId, confirmedPayload, event.requestContext.domainName, event.requestContext.stage);

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ message: 'item sold' })
    });
  } catch (error) {
    console.log(error);

    const endpoint = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
    const payload = {
      msgType: 'auction_error',
      message: 'Unable to mark the item sold'
    };
    await websocketBroadcastToConnection(endpoint, event.requestContext.connectionId, payload);

    callback(null, {
      statusCode: 500,
      body: JSON.stringify({ message: 'error selling item '})
    });
  }
}