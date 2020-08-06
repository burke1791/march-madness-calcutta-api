const jwt = require('jsonwebtoken');
const jwkToPem = require('jwk-to-pem');

const jwk = require('../jwks.json');

console.log(process.env.APP_ENV);
console.log(jwk);

let pem = jwkToPem(jwk[process.env.APP_ENV].keys[0]);

export async function verifyToken(token) {
  let decodedToken = await jwt.verify(token, pem, { algorithms: ['RS256'] });
  return decodedToken['cognito:username'];
}