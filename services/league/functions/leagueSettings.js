import { connection, BigInt, Varchar, Table, Decimal } from '../../../common/utilities/db';

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

    callback(null, result.recordset);
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

export async function getLeaguePayoutSettings(event, context, callback) {
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
      .execute('dbo.up_GetLeaguePayoutSettings');

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}

export async function updateLeaguePayoutSettings(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    let cognitoSub = event.cognitoPoolClaims.sub;

    let { leagueId, settings } = event.body;

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    let payoutSettings = constructUpdatedPayoutSettingsArray(settings);

    let tvp = Table();
    tvp.columns.add('TournamentPayoutId', BigInt, { nullable: false });
    tvp.columns.add('PayoutRate', Decimal(9, 4), { nullable: true });
    tvp.columns.add('PayoutThreshold', Decimal(9, 4), { nullable: true });

    payoutSettings.forEach(obj => {
      tvp.rows.add(obj.tournamentPayoutId, obj.payoutRate, obj.payoutThreshold);
    });

    let result = await connection.pool.request()
      .input('LeagueId', BigInt, leagueId)
      .input('CognitoSub', Varchar(256), cognitoSub)
      .input('PayoutSettings', tvp)
      .execute('dbo.up_UpdateLeaguePayoutSettings');

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}

export async function updateLeagueName(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    let cognitoSub = event.cognitoPoolClaims.sub;

    let { leagueId, newLeagueName } = event.body;

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    let result = await connection.pool.request()
      .input('LeagueId', BigInt, leagueId)
      .input('CognitoSub', Varchar(256), cognitoSub)
      .input('NewLeagueName', Varchar(50), newLeagueName)
      .execute('dbo.up_UpdateLeagueName');

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}

function constructUpdatedPayoutSettingsArray(settings) {
  let arr = [];

  settings.forEach((obj) => {
    let existingSetting = arr.find(e => e.tournamentPayoutId == obj.settingParameterId);

    if (existingSetting !== undefined && obj.type == 'payoutRate') {
      existingSetting.payoutRate = obj.settingValue;
    } else if (existingSetting !== undefined && obj.type == 'payoutThreshold') {
      existingSetting.payoutThreshold = obj.settingValue;
    } else {
      let newSetting = {
        tournamentPayoutId: obj.settingParameterId,
        payoutRate: obj.type == 'payoutRate' ? obj.settingValue : null,
        payoutThreshold: obj.type == 'payoutThreshold' ? obj.settingValue : null
      };

      arr.push(newSetting);
    }
  });

  return arr;
}