import AWS from 'aws-sdk';
import { DYNAMODB_TABLES } from '../../utilities/constants';
import { websocketBroadcastAll } from '../../utilities/websocketBroadcast';
import { parseAuctionSettings } from '../../utilities/parseAuctionSettings';

const AUCTION_SETTINGS_TABLE = DYNAMODB_TABLES.AUCTION_SETTINGS_TABLE;
const dynamodb = new AWS.DynamoDB();

export async function syncAuctionSettings(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  const { leagueId, settingCategory, settings } = event;
  console.log(leagueId);
  console.log(settingCategory);
  console.log(settings);

  try {
    const dynamodbParams = buildDynamoDbParams(leagueId, settingCategory, settings);
    console.log(dynamodbParams);

    const updateResponse = await dynamodb.updateItem(dynamodbParams).promise();
    console.log(updateResponse);

    const updateData = updateResponse.Attributes;
    console.log(updateData);

    const data = parseAuctionSettings(updateData);

    const payload = {
      msgObj: data,
      msgType: `auction_settings`
    };

    const endpoint = `https://${process.env.WEBSOCKET_ENDPOINT}`;
    await websocketBroadcastAll(leagueId, payload, endpoint);

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ message: 'auction settings synced' })
    });
  } catch (error) {
    console.log(error);

    callback(null, {
      statusCode: 500,
      body: JSON.stringify({ message: 'error syncing auction settings' })
    });
  }
}

function buildDynamoDbParams(leagueId, settingCategory, settings) {
  switch (settingCategory) {
    case 'AUCTION':
      return buildAuctionSettingsDynamoDbParams(leagueId, settings);
    case 'BID':
      return buildBidRuleDynamoDbParams(leagueId, settings);
    case 'TAX':
      return buildTaxRuleDynamoDbParams(leagueId, settings);
    default:
      console.log('unknown settingCategory', settingCategory);
      return {};
  }
}

function buildAuctionSettingsDynamoDbParams(leagueId, settings) {
  if (settings?.length == 0) throw new Error('Auction settings list is empty');

  const parsedAuctionSettings = constructAuctionSettingsList(settings);

  const dynamoDbParams = {
    TableName: AUCTION_SETTINGS_TABLE,
    ReturnValues: 'ALL_NEW',
    Key: {
      LeagueId: {
        N: String(leagueId)
      }
    },
    ExpressionAttributeNames: {
      '#AS': 'AuctionSettings'
    },
    ExpressionAttributeValues: {
      ':LM': {
        L: parsedAuctionSettings
      }
    },
    UpdateExpression: 'SET #LM = :LM'
  };

  return dynamoDbParams;
}

function buildBidRuleDynamoDbParams(leagueId, settings) {
  const parsedBidRuleSettings = constructBidRulesList(settings);

  const dynamoDbParams = {
    TableName: AUCTION_SETTINGS_TABLE,
    ReturnValues: 'ALL_NEW',
    Key: {
      LeagueId: {
        N: String(leagueId)
      }
    },
    ExpressionAttributeNames: {
      '#BR': 'BidRules'
    },
    ExpressionAttributeValues: {
      ':BR': {
        L: parsedBidRuleSettings
      }
    },
    UpdateExpression: 'SET #BR = :BR'
  };

  return dynamoDbParams;
}

function buildTaxRuleDynamoDbParams(leagueId, settings) {
  const parsedTaxRuleSettings = constructTaxRulesList(settings);

  const dynamoDbParams = {
    TableName: AUCTION_SETTINGS_TABLE,
    ReturnValues: 'ALL_NEW',
    Key: {
      LeagueId: {
        N: String(leagueId)
      }
    },
    ExpressionAttributeNames: {
      '#TR': 'TaxRules'
    },
    ExpressionAttributeValues: {
      ':TR': {
        L: parsedTaxRuleSettings
      }
    },
    UpdateExpression: 'SET #TR = :TR'
  };

  return dynamoDbParams;
}

function constructAuctionSettingsList(settings) {
  console.log(settings);
  console.log(Array.isArray(settings));
  if (!Array.isArray(settings)) return [];
  
  return settings.map(s => {
    return {
      M: {
        code: {
          S: s.Code
        },
        Constrained: {
          BOOL: s.Constrained
        },
        dataType: {
          S: s.DataType
        },
        decimalPrecision: s.DecimalPrecision != null ?
          { N: String(s.DecimalPrecision) } :
          { NULL: true },
        description: {
          S: s.Description
        },
        displayOrder: {
          N: String(s.DisplayOrder)
        },
        displayPrefix: s.DisplayPrefix != null ?
          { S: s.DisplayPrefix } :
          { NULL: true },
        displaySuffix: s.DisplaySuffix != null ?
          { S: s.DisplaySuffix } :
          { NULL: true },
        leagueId: {
          N: String(s.LeagueId)
        },
        maxValue: s.MaxValue != null ?
          { N: String(s.MaxValue) } :
          { NULL: true },
        minValue: s.MinValue != null ?
          { N: String(s.MinValue) } :
          { NULL: true },
        name: {
          S: s.Name
        },
        settingClass: {
          S: s.SettingClass
        },
        settingParameterId: {
          N: String(s.SettingParameterId)
        },
        settingValue: s.SettingValue != null ?
          { S: s.SettingValue } :
          { NULL: true },
        trailingText: s.TrailingText != null ?
          { S: s.TrailingText } :
          { NULL: true }
      }
    };
  });
}

function constructBidRulesList(settings) {
  if (!Array.isArray(settings)) return [];

  return settings.map(s => {
    return {
      M: {
        auctionBidRuleId: {
          N: String(s.AuctionBidRuleId)
        },
        helpText: {
          S: s.HelpText
        },
        leagueId: {
          N: String(s.LeagueId)
        },
        maxThresholdInclusive: s.MaxThresholdInclusive != null ?
          { N: String(s.MaxThresholdInclusive) } :
          { NULL: true },
        minIncrement: {
          N: String(s.MinIncrement)
        },
        minThresholdExclusive: {
          N: String(s.MinThresholdExclusive)
        }
      }
    };
  });
}

function constructTaxRulesList(settings) {
  if (!Array.isArray(settings)) return [];

  return settings.map(s => {
    return {
      M: {
        auctionTaxRuleId: {
          N: String(s.AuctionTaxRuleId)
        },
        helpText: {
          S: s.HelpText
        },
        leagueId: {
          N: String(s.LeagueId)
        },
        maxThresholdInclusive: s.MaxThresholdInclusive != null ?
          { N: String(s.MaxThresholdInclusive) } :
          { NULL: true },
        taxRate: {
          N: String(s.TaxRate)
        },
        minThresholdExclusive: {
          N: String(s.MinThresholdExclusive)
        }
      }
    };
  });
}

/*
AuctionSettings dynamodb fields

LeagueId
AuctionSettings: [
  {
    Code
    Constrained
    DataType
    DecimalPrecision
    Description
    DisplayOrder
    DisplayPrefix
    DisplaySuffix
    LeagueId
    MaxValue
    MinValue
    Name
    SettingClass
    SettingParameterId
    SettingValue
    TrailingText
  }
]
BidRules: [
  {
    AuctionBidRuleId
    HelpText
    LeagueId
    MaxThresholdInclusive
    MinIncrement
    MinThresholdExclusive
  }
]
TaxRules: [
  {
    AuctionTaxRuleId
    HelpText
    LeagueId
    MaxThresholdInclusive
    MinThresholdExclusive
    TaxRate
  }
]
*/