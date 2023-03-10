import { BigInt, connection, Varchar } from '../../../../common/utilities/db';

export async function getAuctionSummary(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const cognitoSub = event.cognitoPoolClaims.sub;
  const leagueId = event.path.leagueId;

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const result = await connection.pool.request()
      .input('CognitoSub', Varchar(256), cognitoSub)
      .input('LeagueId', BigInt, leagueId)
      .execute('dbo.up_GetAuctionSummary');
    
    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, {
      statusCode: 500,
      message: 'SERVER ERROR!'
    });
  }
}