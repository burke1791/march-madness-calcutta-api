import sql from 'mssql';
// import { BigInt, connection, Varchar } from "../../../common/utilities/db";
import { populateAuctionTaxRuleTypeTVP } from "../common/auctionTaxRuleType";

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

export async function getAuctionTaxRule(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const cognitoSub = event.cognitoPoolClaims.sub;
  const leagueId = event.path.leagueId;

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const result = await connection.pool.request()
      .input('LeagueId', sql.BigInt, leagueId)
      .input('CognitoSub', sql.VarChar(256), cognitoSub)
      .execute('dbo.up_GetLeagueTaxRules');

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, error);
  }
}

export async function setAuctionTaxRule(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const { cognitoSub, leagueId, rules } = event;

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const tvp = populateAuctionTaxRuleTypeTVP(rules);

    const result = await connection.pool.request()
      .input('LeagueId', sql.BigInt, leagueId)
      .input('CognitoSub', sql.VarChar(256), cognitoSub)
      .input('AuctionTaxRules', tvp)
      .execute('dbo.up_SetLeagueTaxRules');

    callback(null, result);
  } catch (error) {
    console.log(error);
    callback(null, error);
  }
}