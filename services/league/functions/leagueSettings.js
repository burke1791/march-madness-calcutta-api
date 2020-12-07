import { connection, BigInt, Varchar, Table } from '../../../common/utilities/db';

export async function updateLeagueSettings(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    let cognitoSub = event.cognitoPoolClaims.sub;

    let { leagueId, settings } = event.body;

    console.log(settings);

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    let tvp = Table();
    tvp.columns.add('SettingParameterId', BigInt, { nullable: false });
    tvp.columns.add('SettingValue', Varchar(255), { nullable: true });

    settings.forEach(obj => {
      tvp.rows.add(obj.settingParameterId, obj.settingValue);
    });

    let result = await connection.pool.request()
      .input('LeagueId', BigInt, leagueId)
      .input('CognitoSub', Varchar(256), cognitoSub)
      .input('SettingInputs', tvp)
      .execute('dbo.up_UpdateLeagueSettings');

    console.log(result);

    callback(null, { message: 'this endpoint is under construction' });
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}

export async function getLeagueSettings(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    let cognitoSub = event.cognitoPoolClaims.sub;

    let leagueId = event.path.leagueId;

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    let result = await connection.pool.request()
      .input('LeagueId', BigInt, leagueId)
      .input('CognitoSub', Varchar(256), cognitoSub)
      .execute('dbo.up_GetLeagueSettings');

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}