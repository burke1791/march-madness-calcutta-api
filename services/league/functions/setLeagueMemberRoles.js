import { BigInt, connection, Varchar } from "../../../common/utilities/db";
import { populateLeagueMemberRoleTypeTVP } from "../common/leagueMemberRoleType";

export async function setLeagueMemberRole(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const cognitoSub = event.cognitoPoolClaims.sub;
  const leagueId = event.path.leagueId;
  const { roles } = event.body;

  try {
    if (!connection.isConnected) {
      await connection.createConnection();
    }

    const tvp = populateLeagueMemberRoleTypeTVP(roles)

    const result = await connection.pool.request()
      .input('LeagueId', BigInt, leagueId)
      .input('CognitoSub', Varchar(256), cognitoSub)
      .input('UpdatedRoles', tvp)
      .execute('dbo.up_SetLeagueMemberRole');

    callback(null, result.recordset);
  } catch (error) {
    console.log(error);
    callback(null, error);
  }
}