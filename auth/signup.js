//import { success, failure } from './libraries/response-lib';

//const connection = require('./db').connection;
//const verifyToken = require('./libraries/verify').verifyToken;

export async function addUserAfterSignup(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  console.log(event.request.userAttributes);

  callback(null, event);
}