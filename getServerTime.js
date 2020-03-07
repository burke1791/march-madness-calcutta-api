import { success, failure } from './libraries/response-lib';

const connection = require('./db').connection;

export async function getServerTime(event, context, callback) {
  try {
    context.callbackWaitsForEmptyEventLoop = false;

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const query = 'Select [ServerTimestamp] = GetUtcDate()';

    let result = await connection.pool.request().query(query);

    callback(null, success(result.recordset));
  } catch (error) {
    console.log(error);
    callback(null, failure({ message: 'ERROR!' }));
  }
}