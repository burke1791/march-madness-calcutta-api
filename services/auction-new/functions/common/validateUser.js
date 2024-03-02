import AWS from 'aws-sdk';
import { DYNAMODB_TABLES } from '../../utilities/constants';
import { parseLeagueMemberships } from './leagueMembership';

const dynamodb = new AWS.DynamoDB();

const LEAGUE_MEMBERSHIP_TABLE = DYNAMODB_TABLES.LEAGUE_MEMBERSHIP_TABLE;

// verify cognitoSub from the LeagueMembership table in dynamoDb
export async function validateUser(leagueId, cognitoSub, desiredRoleId = null) {
  const dynamodbParams = {
    TableName: LEAGUE_MEMBERSHIP_TABLE,
    Key: {
      LeagueId: {
        N: String(leagueId)
      }
    }
  };

  const data = await dynamodb.getItem(dynamodbParams).promise();

  const leagueMemberships = parseLeagueMemberships(data.Item.LeagueMemberships.L);

  const member = leagueMemberships.find(lm => lm.cognitoSub == cognitoSub);

  let isValid = true;

  if (member == undefined) isValid = false;
  if (desiredRoleId != null && member?.roleId > desiredRoleId) isValid = false;

  return isValid;
}