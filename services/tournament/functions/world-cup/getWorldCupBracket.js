import { BigInt, Varchar } from '../../../../common/utilities/db';
import { parseTournamentTree } from '../../utilities/helper';

const connection = require('../../../../common/utilities/db').connection;

export async function getWorldCupBracket(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const cognitoSub = event.cognitoPoolClaims.sub;
  const leagueId = event.path.leagueId;

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const result = await connection.pool.request()
      .input('LeagueId', BigInt, leagueId)
      .input('CognitoSub', Varchar(256), cognitoSub)
      .execute('dbo.up_TournamentPage_WorldCupKnockout');

    const data = {};

    if (result.recordset[0]?.Error == 'No bracket available') {
      data.errorMessage = 'No bracket available';
    } else {
      const bracket = parseTournamentTree(result.recordsets[1]);
      data.bracketMetadata = result.recordsets[0][0];
      data.bracket = bracket;
    }

    callback(null, data);
  } catch (error) {
    console.log(error);
    callback(null,  { message: 'SERVER ERROR!' });
  }
}