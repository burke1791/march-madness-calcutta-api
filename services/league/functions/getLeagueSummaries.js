import { Varchar } from '../../../common/utilities/db';

const connection = require('../../../common/utilities/db').connection;

export async function getLeagueSummaries(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  let cognitoSub = event.cognitoPoolClaims.sub;

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    let result = await connection.pool.request()
      .input('CognitoSub', Varchar(256), cognitoSub)
      .execute('dbo.up_GetLeagueSummaries');

    const leagues = {
      active: parseActiveLeagues(result.recordset),
      inactive: parseInactiveLeagues(result.recordset)
    };

    callback(null, leagues);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}

function parseActiveLeagues(leagues) {
  return leagues.filter(league => {
    return league.StatusId != 4;
  });
}

function parseInactiveLeagues(leagues) {
  return leagues.filter(league => {
    return league.StatusId == 4;
  })
}