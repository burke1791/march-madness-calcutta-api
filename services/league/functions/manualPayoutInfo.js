import { BigInt, connection, NVarchar, Varchar } from '../../../common/utilities/db';

export async function getManualPayoutInfo(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    const cognitoSub = event.cognitoPoolClaims.sub;
    const leagueId = event.path.leagueId;

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const result = await connection.pool.request()
      .input('LeagueId', BigInt, leagueId)
      .input('CognitoSub', Varchar(256), cognitoSub)
      .execute('dbo.up_GetManualLeaguePayoutInfo');
    
    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'SERVER ERROR!' });
  }
}

export async function setManualPayoutInfo(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    const cognitoSub = event.cognitoPoolClaims.sub;
    const leagueId = event.path.leagueId;

    const { payoutInfo } = event.body;

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const result = await connection.pool.request()
      .input('LeagueId', BigInt, leagueId)
      .input('CognitoSub', Varchar(256), cognitoSub)
      .input('PayoutInfo', NVarchar, payoutInfo)
      .execute('dbo.up_SetManualLeaguePayoutInfo');
    
    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'SERVER ERROR!' });
  }
}