import AWS from 'aws-sdk';
import { DYNAMODB_TABLES } from "../../utilities/constants";

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

  let auctionObj;

  if (!data.Item) {
    // auction record does not exist, send default "initial" auction values
    auctionObj = {
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
    }
  } else {
    auctionObj = {
      Status: data.Item.Status.S,
      CurrentItemId: data.Item.CurrentItemId.N,
      TeamLogoUrl: data.Item.TeamLogoUrl.S,
      ItemTypeId: data.Item.ItemTypeId.N,
      ItemName: data.Item.ItemName.S,
      Seed: data.Item.Seed.N,
      DisplayName: data.Item.DisplayName.S,
      CurrentItemPrice: data.Item.CurrentItemPrice.N,
      CurrentItemWinner: data.Item.CurrentItemWinner.N,
      Alias: data.Item.Alias.S,
      LastBidTimestamp: data.Item.LastBidTimestamp.N
    }
  }

  return auctionObj;
}