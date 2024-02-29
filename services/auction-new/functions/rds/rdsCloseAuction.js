import { BigInt, Decimal, Table, TinyInt } from "../../../../common/utilities/db";

const connection = require('../../../../common/utilities/db').connection;

export async function closeAuction(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const { leagueId, results } = event;

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const tvp = populateAuctionResultsTVP(leagueId, results);

    const result = await connection.pool.request()
      .input('LeagueId', BigInt, leagueId)
      .input('AuctionResults', tvp)
      .execute('dbo.up_AuctionClose');

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}

function populateAuctionResultsTVP(leagueId, results) {
  const tvp = Table();
  tvp.columns.add('LeagueId', BigInt, { nullable: false });
  tvp.columns.add('UserId', BigInt, { nullable: true });
  tvp.columns.add('ItemId', BigInt, { nullable: false });
  tvp.columns.add('ItemTypeId', TinyInt, { nullable: false });
  tvp.columns.add('Price', Decimal(8, 2), { nullable: true });

  results.forEach(r => {
    tvp.rows.add(leagueId, r.userId, r.itemId, r.itemTypeId, r.price);
  });

  return tvp;
}