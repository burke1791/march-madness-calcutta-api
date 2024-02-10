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

  const data = await dynamodb.getItem(params);

  let auctionObj;

  if (!auctionResponse.Item) {
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
      Status: auctionResponse.Item.Status.S,
      CurrentItemId: auctionResponse.Item.CurrentItemId.N,
      TeamLogoUrl: auctionResponse.Item.TeamLogoUrl.S,
      ItemTypeId: auctionResponse.Item.ItemTypeId.N,
      ItemName: auctionResponse.Item.ItemName.S,
      Seed: auctionResponse.Item.Seed.N,
      DisplayName: auctionResponse.Item.DisplayName.S,
      CurrentItemPrice: auctionResponse.Item.CurrentItemPrice.N,
      CurrentItemWinner: auctionResponse.Item.CurrentItemWinner.N,
      Alias: auctionResponse.Item.Alias.S,
      LastBidTimestamp: auctionResponse.Item.LastBidTimestamp.N
    }
  }

  return auctionObj;
}