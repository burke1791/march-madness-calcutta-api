const connection = require('../../../common/utilities/db').connection;

export async function createLeague(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  let cognitoSub = event.cognitoPoolClaims.sub;

  try {
    let body = event.body;
    let name = body.name;
    let password = body.password;
    let tournamentId = Number(body.tournamentId);

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const query = `Insert Into dbo.leagues (name, password, year, statusId, createdBy, tournamentId) Select '${name}', '${password}', t.year, ${1}, u.id, t.id From dbo.users u Cross Join dbo.tournaments t Where u.cognitoSub = '${cognitoSub}' And t.id = ${tournamentId}`;

    await connection.pool.request().query(query);

    callback(null, { message: 'league created' });
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}