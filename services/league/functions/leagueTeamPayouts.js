import sql from 'mssql';
import { populateLeagueTeamPayoutTypeTVP } from "../common/leagueTeamPayoutType";

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

export async function getLeagueTeamPayouts(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    const cognitoSub = event.cognitoPoolClaims.sub;
    const leagueId = event.path.leagueId;

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const result = await connection.pool.request()
      .input('LeagueId', sql.BigInt, leagueId)
      .input('CognitoSub', sql.VarChar(256), cognitoSub)
      .execute('dbo.up_GetLeagueTeamPayouts');

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'SERVER ERROR!' });
  }
}

export async function setLeagueTeamPayouts(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const cognitoSub = event.cognitoPoolClaims.sub;
  const leagueId = event.path.leagueId;
  const { payouts } = event.body;

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const tvp = populateLeagueTeamPayoutTypeTVP(payouts);

    const result = await connection.pool.request()
      .input('LeagueId', sql.BigInt, leagueId)
      .input('CognitoSub', sql.VarChar(256), cognitoSub)
      .input('Payouts', tvp)
      .execute('dbo.up_SetLeagueTeamPayouts');

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, error);
  }
}