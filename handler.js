import { success, failure } from './libraries/response-lib';

const VarChar = require('mssql').VarChar;
const Request = require('mssql').Request;

const connection = require('./db').connection;


export async function updateLastHeartbeat(event, context, callback) {
  try {
    context.callbackWaitsForEmptyEventLoop = false;
    let cognitoSub = event.request.userAttributes.sub;
    let email = event.request.userAttributes.email;
    let alias = event.request.userAttributes.preferred_username;

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    //let result = await connection.pool.request().query('Update dbo.users Set lastHeartbeat = GetDate() Where cognitoSub = \'' + cognitoSub + '\'');

    const request = new Request();
    request.input('email', VarChar(50), email);
    request.input('alias', VarChar(256), alias);
    request.input('cognitoSub', VarChar(256), cognitoSub);
    let result = await request.execute('dbo.up_updateUsers');

    console.log(result);
    callback(null, success({ message: 'heartbeat updated' }));
  } catch (error) {
    console.log(error);
    callback(null, failure({ message: 'ERROR!' }));
  }
}