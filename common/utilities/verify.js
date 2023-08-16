import { CognitoJwtVerifier } from 'aws-jwt-verify';

// const jwt = require('jsonwebtoken');
// const jwkToPem = require('jwk-to-pem');

// const jwk = require('../config/jwks.json');

console.log(process.env.APP_ENV);
// console.log(jwk);
console.log(process.env.USER_POOL_ID);
console.log(process.env.USER_POOL_CLIENT_ID);

// let pem = jwkToPem(jwk[process.env.APP_ENV].keys[0]);

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.USER_POOL_ID,
  tokenUse: null,
  clientId: process.env.USER_POOL_CLIENT_ID
});

export async function verifyToken(token) {
  // let decodedToken = await jwt.verify(token, pem, { algorithms: ['RS256'] });
  // return decodedToken['cognito:username'];

  try {
    const payload = await verifier.verify(token);
    console.log(payload);
    return payload.sub;
  } catch (error) {
    console.log('Error validating token');
    console.log(error);
    return null;
  }
}