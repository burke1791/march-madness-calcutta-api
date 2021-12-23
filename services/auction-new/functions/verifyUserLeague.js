import { connection, Varchar } from '../../../common/utilities/db';

export async function verifyUserLeague(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  console.log(event);

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    let result = await connection.pool.request()
      .input('TestInput', Varchar(100), 'Hello')
      .execute('dbo.up_Test');

    console.log(result);

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}