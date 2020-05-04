
const connection = require('./db').connection;

export async function getServerTime(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

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