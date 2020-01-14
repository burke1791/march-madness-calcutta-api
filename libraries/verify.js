const jwt = require('jsonwebtoken');
const jwkToPem = require('jwk-to-pem');

const jwk = require('../jwks.json');

let pem = jwkToPem(jwk.keys[0]);

export async function verifyToken(token) {
  let decodedToken = await jwt.verify(token, pem, { algorithms: ['RS256'] });
  return decodedToken['cognito:username'];
}