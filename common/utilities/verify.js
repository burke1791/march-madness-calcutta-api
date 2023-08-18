import { CognitoJwtVerifier } from 'aws-jwt-verify';

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.USER_POOL_ID,
  tokenUse: null,
  clientId: process.env.USER_POOL_CLIENT_ID
});

export async function verifyToken(token) {
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