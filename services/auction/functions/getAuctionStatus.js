import { BigInt, connection, Varchar } from '../../../common/utilities/db';

export async function getAuctionStatus(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  let cognitoSub = event.cognitoPoolClaims.sub;

  try {
    let leagueId = event.path.leagueId;

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    let result = await connection.pool.request()
      .input('CognitoSub', Varchar(256), cognitoSub)
      .input('LeagueId', BigInt, leagueId)
      .execute('dbo.up_GetAuctionStatus');

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}