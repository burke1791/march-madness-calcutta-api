import { Varchar } from '../../../common/utilities/db';
import { parseLeagueSummaries } from '../parsers/leagueSummaries';

const connection = require('../../../common/utilities/db').connection;

export async function getLeagueSummaries(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const cognitoSub = event.cognitoPoolClaims.sub;

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const result = await connection.pool.request()
      .input('CognitoSub', Varchar(256), cognitoSub)
      .execute('dbo.up_GetLeagueSummaries');

    const data = parseLeagueSummaries(result.recordset);

    const leagues = {
      active: parseActiveLeagues(data),
      inactive: parseInactiveLeagues(data)
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