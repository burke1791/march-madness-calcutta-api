import { Varchar } from '../../../common/utilities/db';

const connection = require('../../../common/utilities/db').connection;

export async function joinLeague(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  let cognitoSub = event.cognitoPoolClaims.sub;
  console.log(event);

  try {
    let { leagueGuid } = event.body;

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    // let result = await connection.pool.request().query(`
    // With cte As (
    //   Select [leagueId] = l.id
    //   From dbo.leagues l
    //   Where l.name = '${name}'
    //   And l.password = '${password}'
    //   And l.statusId < 2
    // )
    // Insert Into dbo.leagueMemberships (userId, leagueId, roleId)
    // Select u.id
    // , cte.leagueId
    // , 3
    // From dbo.users u
    // Cross Join cte
    // Where u.cognitoSub = '${cognitoSub}'`);

    let result = await connection.pool.request()
      .input('CognitoSub', Varchar(256), cognitoSub)
      .input('LeagueGuid', Varchar(256), leagueGuid)
      .execute('dbo.up_JoinLeague');

    console.log(result.recordset);

    if (result.recordset[0]?.Error == undefined) {
      let leagueId = result.recordset[0].LeagueId;
      result.recordset[0].LeaguePath = `/leagues/${leagueId}`;
    }

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, error);
  }
}