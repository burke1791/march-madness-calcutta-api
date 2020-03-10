import { success, failure } from './libraries/response-lib';

const connection = require('./db').connection;
const verifyToken = require('./libraries/verify').verifyToken;

export async function getTournamentOptions(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    let cognitoSub = await verifyToken(event.headers['x-cognito-token']);

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    let query = `Select t.name, t.id
                From dbo.tournaments t
                Where t.testOnly = 0
                And t.invalidated Is Null
                Union
                Select t.name, t.id
                From dbo.tournaments t
                Where t.testOnly = 1
                And t.invalidated Is Null
                And Exists (
                  Select *
                  From dbo.users u
                  Where u.cognitoSub = '${cognitoSub}'
                  And u.permissionId In (2, 3)
                )`;

    let result = await connection.pool.request().query(query);
    console.log(result);

    callback(null, success(result.recordset));
  } catch (error) {
    console.log(error);
    callback(null, failure({ message: 'ERROR!' }));
  }
}