import { Int, SmallInt, Varchar } from '../../../common/utilities/db';

const connection = require('../../../common/utilities/db').connection;

export async function createLeague(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  let cognitoSub = event.cognitoPoolClaims.sub;

  try {
    let body = event.body;
    let name = body.name;
    let password = body.password;
    let tournamentId = Number(body.tournamentId);
    let tournamentRegimeId = Number(body.tournamentScopeId);

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    let result = await connection.pool.request()
      .input('CognitoSub', Varchar(256), cognitoSub)
      .input('LeagueName', Varchar(50), name)
      .input('LeaguePassword', Varchar(50), password)
      .input('TournamentId', SmallInt, tournamentId)
      .input('TournamentRegimeId', Int, tournamentRegimeId)
      .execute('dbo.up_CreateLeague');

    if (Array.isArray(result.recordset) && result.recordset[0]?.Error) {
      throw new Error(result.recordset.Error);
    }

    callback(null, { message: 'league created' });
  } catch (error) {
    console.log(error);
    callback({ message: error });
  }
}