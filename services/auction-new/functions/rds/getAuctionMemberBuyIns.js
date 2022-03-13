import { BigInt, connection, Varchar } from '../../../../common/utilities/db';

export async function getAuctionMemberBuyIns(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  let cognitoSub = event.cognitoPoolClaims.sub;

  try {
    let leagueId = event.path.leagueId;

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    let result = await connection.pool.request()
      .input('LeagueId', BigInt, leagueId)
      .input('CognitoSub', Varchar(256), cognitoSub)
      .execute('dbo.up_GetAuctionMemberBuyIns');

    const data = {
      buyIns: result.recordsets[0],
      tax: result.recordsets[1]
    };

    callback(null, data);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}