import { callbackWaitsForEmptyEventLoopFalse } from './utilities/common';
const connection = require('./db').connection;

export async function getServerTime(event, context, callback) {
  callbackWaitsForEmptyEventLoopFalse(context);

  // in case we need it for future refactoring
  // let cognitoSub = event.cognitoPoolClaims.sub;

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const query = 'Select [ServerTimestamp] = GetUtcDate()';

    let result = await connection.pool.request().query(query);

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}