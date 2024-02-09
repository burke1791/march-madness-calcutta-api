import { BigInt, Table, TinyInt, Varchar } from '../../../common/utilities/db';

const connection = require('../../../common/utilities/db').connection;

export async function newLeagueSeedGroup(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const { cognitoSub, leagueId, groupName, groupTeams } = event;

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const tvp = Table();
    tvp.columns.add('ItemTypeId', TinyInt, { nullable: false });
    tvp.columns.add('ItemId', BigInt, { nullable: false });

    groupTeams.forEach(team => {
      tvp.rows.add(team.itemTypeId, team.itemId);
    });

    const result = await connection.pool.request()
      .input('LeagueId', BigInt, leagueId)
      .input('CognitoSub', Varchar(256), cognitoSub)
      .input('GroupName', Varchar(128), groupName)
      .input('GroupTeams', tvp)
      .execute('dbo.up_NewLeagueSeedGroup');

    const data = result.recordset;
    console.log(data);

    callback(null, data);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}

export async function deleteLeagueSeedGroup(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const { cognitoSub, leagueId, groupId } = event;

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const result = await connection.pool.request()
      .input('LeagueId', BigInt, leagueId)
      .input('CognitoSub', Varchar(256), cognitoSub)
      .input('SeedGroupId', BigInt, groupId)
      .execute('dbo.up_DeleteLeagueSeedGroup');

    const data = result.recordset;
    console.log(data);

    callback(null, data);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}

export async function updateLeagueSeedGroup(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const { cognitoSub, leagueId, groupId, groupName, groupTeams } = event;

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const tvp = Table();
    tvp.columns.add('ItemTypeId', TinyInt, { nullable: false });
    tvp.columns.add('ItemId', BigInt, { nullable: false });

    groupTeams.forEach(team => {
      tvp.rows.add(team.itemTypeId, team.itemId);
    });

    const result = await connection.pool.request()
      .input('LeagueId', BigInt, leagueId)
      .input('CognitoSub', Varchar(256), cognitoSub)
      .input('SeedGroupId', BigInt, groupId)
      .input('GroupName', Varchar(128), groupName)
      .input('GroupTeams', tvp)
      .execute('dbo.up_SetLeagueSeedGroup');

    const data = result.recordset;
    console.log(data);

    callback(null, data);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'Server Error' });
  }
}