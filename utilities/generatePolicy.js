const generatePolicy = function (principalId, effect, resource, cognitoSub) {
  const authResponse = {};
  authResponse.principalId = principalId;
  if (effect && resource) {
    const context = {
      cognitoSub: cognitoSub
    };
    authResponse.context = context;
    const policyDocument = {};
    // default version
    policyDocument.Version = "2012-10-17";
    policyDocument.Statement = [];
    const statementOne = {};
    // default action
    statementOne.Action = "execute-api:Invoke";
    statementOne.Effect = effect;
    statementOne.Resource = resource;
    policyDocument.Statement[0] = statementOne;
    authResponse.policyDocument = policyDocument;
  }
  return authResponse;
};

export const generateAllow = function (principalId, resource, cognitoSub) {
  return generatePolicy(principalId, "Allow", resource, cognitoSub);
};

export const generateDeny = function (principalId, resource) {
  return generatePolicy(principalId, "Deny", resource);
};