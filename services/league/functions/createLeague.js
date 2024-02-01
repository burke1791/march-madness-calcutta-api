import { Int, SmallInt, Varchar } from '../../../common/utilities/db';

const connection = require('../../../common/utilities/db').connection;

export async function createLeague(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    const { cognitoSub, name, password, tournamentId, tournamentRegimeId } = event;

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const result = await connection.pool.request()
      .input('CognitoSub', Varchar(256), cognitoSub)
      .input('LeagueName', Varchar(50), name)
      .input('LeaguePassword', Varchar(50), password)
      .input('TournamentId', SmallInt, tournamentId)
      .input('TournamentRegimeId', Int, tournamentRegimeId)
      .execute('dbo.up_CreateLeague');

    console.log(result);

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(error);
  }
}