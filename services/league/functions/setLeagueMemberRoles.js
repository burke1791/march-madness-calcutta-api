import sql from 'mssql';
// import { BigInt, Varchar } from "../../../common/utilities/db";
import { populateLeagueMemberRoleTypeTVP } from "../common/leagueMemberRoleType";

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
    // console.log(config);
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

export async function setLeagueMemberRole(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const cognitoSub = event.cognitoPoolClaims.sub;
  const leagueId = event.path.leagueId;
  const { roles } = event.body;

  console.log(roles);

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const tvp = populateLeagueMemberRoleTypeTVP(roles);

    const result = await connection.pool.request()
      .input('LeagueId', sql.BigInt, leagueId)
      .input('CognitoSub', sql.VarChar(256), cognitoSub)
      .input('UpdatedRoles', tvp)
      .execute('dbo.up_SetLeagueMemberRole');

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, error);
  }
}