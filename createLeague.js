
import { success, failure } from './libraries/response-lib';

const sql = require('mssql');

const connection = require('./db').connection;
const verifyToken = require('./libraries/verify').verifyToken;

export async function createLeague(event, context, callback) {
  try {
    context.callbackWaitsForEmptyEventLoop = false;

    let body = JSON.parse(event.body);
    let name = body.name;
    let password = body.password;
    let year = body.year;
    let auctionId = 'placeholder';

    let cognitoSub = await verifyToken(event.headers['x-cognito-token']);

    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const request = new sql.Request();
    request.input('cognitoSub', sql.VarChar(256), cognitoSub);
    request.input('name', sql.VarChar(50), name);
    request.input('password', sql.VarChar(50), password);
    request.input('year', sql.SmallInt(), year);
    request.input('auctionId', sql.VarChar(256), auctionId);

    await request.execute('dbo.up_createLeague');

    callback(null, success({ message: 'league created' }));
  } catch (error) {
    console.log(error);
    callback(null, failure({ message: 'ERROR!' }));
  }
}