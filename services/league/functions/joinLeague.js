import AWS from 'aws-sdk';
import { Varchar } from '../../../common/utilities/db';
import { LAMBDAS } from '../utilities/constants';

const lambda = new AWS.Lambda();

const connection = require('../../../common/utilities/db').connection;

export async function joinLeague(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  let cognitoSub = event.cognitoPoolClaims.sub;

  try {
    let { inviteCode } = event.body;

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    let result = await connection.pool.request()
      .input('CognitoSub', Varchar(256), cognitoSub)
      .input('LeagueGuid', Varchar(256), inviteCode)
      .execute('dbo.up_JoinLeague');

    const response = [];

    if (result.recordset[0]?.Error == undefined) {
      const leagueId = result.recordset[0].LeagueId;

      await syncLeagueMembershipData(leagueId, result.recordset);

      response.push({ 
        LeagueId: leagueId,
        LeaguePath: `/leagues/${leagueId}`
      });
    } else {
      response.push({ Error: result.recordset[0].Error });
    }

    callback(null, response);
  } catch (error) {
    console.log(error);
    callback(null, error);
  }
}

async function syncLeagueMembershipData(leagueId, leagueMemberships) {
  const lambdaParams = {
    FunctionName: LAMBDAS.SYNC_LEAGUE_MEMBERSHIP,
    LogType: 'Tail',
    Payload: JSON.stringify({ leagueId: leagueId, leagueMemberships: leagueMemberships })
  };

  try {
    const lambdaResponse = await lambda.invoke(lambdaParams).promise();
    console.log(lambdaResponse);
  } catch (error) {
    console.log(error);
    console.log('Unable to sync league membership. Should I undo the SQL Server action?');
  }
}