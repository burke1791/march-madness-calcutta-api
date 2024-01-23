const sql = require('mssql');

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

    console.log(payouts);
    console.log(tvp);

    const result = await connection.pool.request()
      .input('LeagueId', BigInt, leagueId)
      .input('CognitoSub', Varchar(256), cognitoSub)
      .input('Payouts', tvp)
      .execute('dbo.up_SetLeagueTeamPayouts');

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, error);
  }
}


/**
 * @typedef LeagueTeamPayout
 * @property {Number} [LeagueTeamPayoutId]
 * @property {Number} TeamId
 * @property {Number} PayoutAmount
 * @property {Number} UpdatedByUserId
 * @property {String} PayoutDescription
 * @property {Boolean} IsDeleted
 */

/**
 * @function
 * @param {Array<LeagueTeamPayout>} payouts 
 * @returns a sql server table-valued parameter with the provided bidding rules
 */
function populateLeagueTeamPayoutTypeTVP(payouts) {
  const tvp = new sql.Table();

  tvp.columns.add('LeagueTeamPayoutId', sql.BigInt, { nullable: true });
  tvp.columns.add('TeamId', sql.BigInt, { nullable: false });
  tvp.columns.add('PayoutAmount', sql.Decimal(8, 2), { nullable: false });
  tvp.columns.add('UpdatedByUserId', sql.BigInt, { nullable: false });
  tvp.columns.add('PayoutDescription', sql.VarChar(500), { nullable: true });
  tvp.columns.add('IsDeleted', sql.Bit, { nullable: false });

  payouts.forEach(payout => {
    tvp.rows.add(
      payout.LeagueTeamPayoutId ? +payout.LeagueTeamPayoutId : null,
      +payout.TeamId,
      +payout.PayoutAmount,
      +payout.UpdatedByUserId,
      payout.PayoutDescription ? payout.PayoutDescription : null,
      payout.IsDeleted
    );
  });

  return tvp;
}