import AWS from 'aws-sdk';
import { DYNAMODB_TABLES } from '../../utilities/constants';

const dynamodb = new AWS.DynamoDB();

export async function getAuctionStatus(leagueId) {
  const params = {
    TableName: DYNAMODB_TABLES.AUCTION_TABLE,
    Key: {
      LeagueId: {
        N: String(leagueId)
      }
    }
  };

  const data = await dynamodb.getItem(params).promise();

  return parseAuctionStatus(data.Item);
}

export function parseAuctionStatus(data) {
  if (!data) {
    // auction record does not exist, send default "initial" auction values
    return {
      Status: 'initial',
      CurrentItemId: null,
      TeamLogoUrl: null,
      ItemTypeId: null,
      ItemName: null,
      Seed: null,
      DisplayName: null,
      CurrentItemPrice: 0,
      CurrentItemWinner: null,
      Alias: null,
      LastBidTimestamp: null
    };
  } else {
    return {
      Status: data.Status.S,
      CurrentItemId: data.CurrentItemId.N,
      TeamLogoUrl: data.TeamLogoUrl.S,
      ItemTypeId: data.ItemTypeId.N,
      ItemName: data.ItemName.S,
      Seed: data.Seed.N,
      DisplayName: data.DisplayName.S,
      CurrentItemPrice: data.CurrentItemPrice.N,
      CurrentItemWinner: data.CurrentItemWinner.N,
      Alias: data.Alias.S,
      LastBidTimestamp: data.LastBidTimestamp.N
    }
  };
}