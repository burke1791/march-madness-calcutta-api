import { BigInt, Table, TinyInt, Varchar } from '../../../common/utilities/db';

const connection = require('../../../common/utilities/db').connection;

export async function newLeagueSeedGroup(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  let cognitoSub = event.cognitoPoolClaims.sub;

  let { leagueId, groupName, groupTeams } = event.body;

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    let tvp = Table();
    tvp.columns.add('ItemId', BigInt, { nullable: false });
    tvp.columns.add('ItemTypeId', TinyInt, { nullable: false });

    groupTeams.forEach(team => {
      tvp.rows.add(team.itemId, team.itemTypeId);
    });

    let result = await connection.pool.request()
      .input('LeagueId', BigInt, leagueId)
      .input('CognitoSub', Varchar(256), cognitoSub)
      .input('GroupName', Varchar(128), groupName)
      .input('Teams', tvp)
      .execute('dbo.up_NewLeagueSeedGroup');

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}

export async function deleteLeagueSeedGroup(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  let cognitoSub = event.cognitoPoolClaims.sub;

  let { leagueId, groupId } = event.body;

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    let result = await connection.pool.request()
      .input('LeagueId', BigInt, leagueId)
      .input('CognitoSub', Varchar(256), cognitoSub)
      .input('SeedGroupId', BigInt, groupId)
      .execute('dbo.up_DeleteLeagueSeedGroup');

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}