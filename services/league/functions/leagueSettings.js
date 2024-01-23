import sql from 'mssql';
// import { connection, BigInt, Varchar, Table, Decimal } from '../../../common/utilities/db';

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST,
  database: process.env.DB_NAME,
  options: {
    trustServerCertificate: true
  }
};

const connection = {
  isConnected: false,
  pool: null,
  createConnection: async function() {
    console.log(config);
    if (this.pool == null) {
      try {
        console.log('creating connection');
        this.pool = await sql.connect(config);
        this.isConnected = true;
      } catch (error) {
        console.log(error);
        this.isConnected = false;
        this.pool = null;
      }
    }
  }
};

export async function updateLeagueSettings(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    let cognitoSub = event.cognitoPoolClaims.sub;

    let { leagueId, settings } = event.body;

    console.log(settings);

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    let tvp = sql.Table();
    tvp.columns.add('SettingParameterId', sql.BigInt, { nullable: false });
    tvp.columns.add('SettingValue', sql.VarChar(255), { nullable: true });

    settings.forEach(obj => {
      tvp.rows.add(obj.settingParameterId, obj.settingValue);
    });

    let result = await connection.pool.request()
      .input('LeagueId', sql.BigInt, leagueId)
      .input('CognitoSub', sql.VarChar(256), cognitoSub)
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
    const cognitoSub = event.cognitoPoolClaims.sub;
    const leagueId = event.path.leagueId;
    const settingClass = event.query.settingClass;

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    let result = await connection.pool.request()
      .input('LeagueId', sql.BigInt, leagueId)
      .input('CognitoSub', sql.VarChar(256), cognitoSub)
      .input('SettingClass', settingClass)
      .execute('dbo.up_GetLeagueSettings');

    callback(null, {
      settings: result.recordset,
      allowed: result.recordsets[1] || []
    });
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
      .input('LeagueId', sql.BigInt, leagueId)
      .input('CognitoSub', sql.Varchar(256), cognitoSub)
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

    let tvp = sql.Table();
    tvp.columns.add('TournamentPayoutId', sql.BigInt, { nullable: false });
    tvp.columns.add('PayoutRate', sql.Decimal(9, 4), { nullable: true });
    tvp.columns.add('PayoutThreshold', sql.Decimal(9, 4), { nullable: true });

    settings.forEach(obj => {
      tvp.rows.add(obj.tournamentPayoutId, obj.payoutRate, obj.payoutThreshold);
    });

    let result = await connection.pool.request()
      .input('LeagueId', sql.BigInt, leagueId)
      .input('CognitoSub', sql.VarChar(256), cognitoSub)
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
      .input('LeagueId', sql.BigInt, leagueId)
      .input('CognitoSub', sql.VarChar(256), cognitoSub)
      .input('NewLeagueName', sql.VarChar(50), newLeagueName)
      .execute('dbo.up_UpdateLeagueName');

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}