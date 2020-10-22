const connection = require('../../../common/utilities/db');

export async function joinLeague(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  let cognitoSub = event.cognitoPoolClaims.sub;

  try {
    let body = event.body;
    let name = body.name;
    let password = body.password;

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    let result = await connection.pool.request().query(`
    With cte As (
      Select [leagueId] = l.id
      From dbo.leagues l
      Where l.name = '${name}'
      And l.password = '${password}'
      And l.statusId = 1
    )
    Insert Into dbo.leagueMemberships (userId, leagueId, roleId)
    Select u.id
    , cte.leagueId
    , 3
    From dbo.users u
    Cross Join cte
    Where u.cognitoSub = '${cognitoSub}'`);

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, error);
  }
}