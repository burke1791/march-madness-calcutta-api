import { success, failure } from './libraries/response-lib';

const sql = require('mssql');

const connection = require('./db').connection;
const verifyToken = require('./libraries/verify').verifyToken;

export async function testLambda(event) {
  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    let result = await connection.pool.request().query('Insert Into testLambda (name) Values (\'Burkcules2\')');

    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.log(error);
  }

  return {
    statusCode: 500,
    body: {
      error: 'ERROR!'
    }
  };
}

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

    const request = new sql.Request();
    request.input('email', sql.VarChar(50), email);
    request.input('alias', sql.VarChar(256), alias);
    request.input('cognitoSub', sql.VarChar(256), cognitoSub);
    let result = await request.execute('dbo.up_updateUsers');

    console.log(result);
    callback(null, event);
  } catch (error) {
    console.log(error);
    callback(null, failure({ message: 'ERROR!' }));
  }
}

export async function verifyTokenTest(event, context, callback) {
  try {
    context.callbackWaitsForEmptyEventLoop = false;

    let cognitoUsername = await verifyToken(event.headers['x-cognito-token']);

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    let result = await connection.pool.request().query('Select * From dbo.users Where cognitoSub = \'' + cognitoUsername + '\'');

    callback(null, success(result.recordset));
  } catch (error) {
    console.log(error);
    callback(null, failure({ message: 'ERROR!' }));
  }
}