import { connection } from '../../../common/utilities/db';

export async function getServerTime(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  // in case we need it for future refactoring
  // let cognitoSub = event.cognitoPoolClaims.sub;

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const query = 'Select [ServerTimestamp] = SysUtcDateTime()';

    let result = await connection.pool.request().query(query);

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, { message: 'ERROR!' });
  }
}