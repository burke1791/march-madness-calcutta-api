import { BigInt, connection, Varchar } from '../../../../common/utilities/db';

export async function getAuctionTeams(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const cognitoSub = event.cognitoPoolClaims.sub;

  try {
    const leagueId = event.path.leagueId;
    const userId = event.query.userId;

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const result = await connection.pool.request()
      .input('CognitoSub', Varchar(256), cognitoSub)
      .input('LeagueId', BigInt, leagueId)
      .input('TargetUserId', BigInt, userId || null)
      .execute('dbo.up_GetAuctionTeams');

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, {
      statusCode: 500,
      body: 'ERROR!'
    });
  }
}