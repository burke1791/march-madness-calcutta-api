import { callbackWaitsForEmptyEventLoopFalse } from '../utilities/common';
const connection = require('../db').connection;

export async function addUserAfterSignup(event, context, callback) {
  callbackWaitsForEmptyEventLoopFalse(context);

  console.log(event.request.userAttributes);

  let email = event.request.userAttributes.email;
  let username = event.request.userAttributes.preferred_username;
  let cognitoSub = event.request.userAttributes.sub;

  if (!connection.isConnected) {
    await connection.createConnection();
  }

  let query = `Insert Into dbo.users (email, alias, permissionId, created, lastHeartbeat, cognitoSub) Values ('${email}', '${username}', 1, GetUtcDate(), GetUtcDate(), '${cognitoSub}')`;

  try {
    await connection.pool.request().query(query);

    callback(null, event);
  } catch (error) {
    console.log(error);
    callback(null, event);
  }
}